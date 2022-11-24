# .octopus file spec

.octopus file is a [ZIP](https://en.wikipedia.org/wiki/ZIP_(file_format)) file
with a few specifics.

- we only use none (0) and DEFLATE (8) compression methods
  - this might change in the future, more exploration of bundle size/file size
    tradeoff is needed
  - this means in javascript we can just use [fflate](https://github.com/101arrowz/fflate)
    without any extra trickery
- first file in the archive has to be named `Octopus` with contents of
  ` is universal design format. opendesign.dev.` (including the starting space).
  It is not compressed.

This means that hexdump outputs something like this:

```
00000000  50 4b 03 04 14 00 08 00  00 00 97 b1 77 55 00 00  |PK..........wU..|
00000010  00 00 00 00 00 00 00 00  00 00 07 00 00 00 4f 63  |..............Oc|
00000020  74 6f 70 75 73 20 69 73  20 75 6e 69 76 65 72 73  |topus is univers|
00000030  61 6c 20 64 65 73 69 67  6e 20 66 6f 72 6d 61 74  |al design format|
00000040  2e 20 6f 70 65 6e 64 65  73 69 67 6e 2e 64 65 76  |. opendesign.dev|
```

**Explanation**: zip file format contains its header at the end of the file.
Start of the file contains only file header (which ends with filename) + contents
of the file. We use this property to insert "Octopus is ..." message near the
start of the file, while preserving zip compatibility. Also, if someone is not
familiar with octopus file format and comes across one, there is a link to
opendesign.dev, where they can find more information.

## Detection

We can't rely on some fields of the header. Following table (modified from wikipedia)
explains which fields are guaranteed to be identical between all octopus files.

| Offset | Bytes | Octopus     | ZIP Description                             |
|--------|-------|-------------|---------------------------------------------|
| 0      |   4   | identical   | Local file header signature = 0x04034b50 (PK♥♦ or "PK\3\4") |
| 4      |   2   | any valid   | Version needed to extract (minimum)         |
| 6      |   2   | 0 or 8      | General purpose bit flag                    |
| 8      |   2   | 0           | Compression method; e.g. none = 0, DEFLATE = 8 (or "\0x08\0x00") |
| 10     |   2   | should be 0 | File last modification time                 |
| 12     |   2   | should be 33 | File last modification date                 |
| 14     |   4   | valid or 0  | CRC-32 of uncompressed data                 |
| 18     |   4   | 0 or 44     | Compressed size (or 0xffffffff for ZIP64)   |
| 22     |   4   | 0 or 44     | Uncompressed size (or 0xffffffff for ZIP64) |
| 26     |   2   | 7           | File name length (n)                        |
| 28     |   2   | 0           | Extra field length (m)                      |
| 30     |   7   | `Octopus`   | File name                                   |
| 30+7   |   0   | empty       | Extra field                                 |
| 37     |   44  | message     | File contents                               |

Therefore detection code must look for:

- file size is at least 134 bytes (smallest possible empty octopus file)
- bytes 0-3 are 0x04034b50 in little-endian
- bytes 8-9 are 0
- bytes 26-29 are 07 00 00 00
- bytes 30+ are "Octopus is universal design format. opendesign.dev." in ASCII

There should be an option not to require this detection in case we want to allow
local modification of octopus files.

*Date note*: zip's date format uses [MS-DOS date format](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-dosdatetimetofiletime). 33 corresponds to 1980/1/1 which is the lowest date possible. It effectively means 0.

## Impact

This means a few things. First is that octopus files are trivial to detect. But,
it comes with a cost, which is that it is harder to produce them. In particular,
basic compression utilities do not allow to set file order, nor set compression
on per-file basis.

I propose that we handle this in following fashion:

- provide a way (CLI + API function) to fix malformed octopus files
- but do not accept malformed octopus files in general APIs

This is because if we did accept any zip files, this would become meaningless
because they would become the de-facto standard. Accepting any zip files is
a change we can do in minor release, the reverse is not.
