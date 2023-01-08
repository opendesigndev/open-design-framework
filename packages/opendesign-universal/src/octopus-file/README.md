# .octopus file spec

.octopus file is a [ZIP](https://en.wikipedia.org/wiki/ZIP_(file_format)) file.
There are two versions of .octopus files: optimized (or complete) and unoptimized
(or plain). Optimized is also just a ZIP file with a few specifics defined.

## Contents

Only specified file is `octopus-manifest.json`. Everything else is referenced
from there. Applications might want to insert extra file to store additional
information which is not yet supported by octopus directly.

## Optimized octopus

To make partial octopus loading possible on the web, we need extra data.
To prepare for that, we have special requirements for optimized octopus files.
Right now, they do not enable partial loading, but the infrastructure is there
and we are complicating things right now to make the transition less painful in
the future.

- we only use none (0) and DEFLATE (8) compression methods
  - this might change in the future, more exploration of bundle size/file size
    tradeoff is needed
  - this means in javascript we can just use [fflate](https://github.com/101arrowz/fflate)
    without any extra trickery
- first file in the archive has to be named `Octopus` with contents of
  `" is universal design format. opendesign.dev."` (including the starting space, excluding quotes).
  It is not compressed.

This means that hexdump outputs something like this:

```
00000000  50 4b 03 04 14 00 00 00  00 00 00 00 21 00 3b e3  |PK..........!.;.|
00000010  ca f5 2c 00 00 00 2c 00  00 00 07 00 00 00 4f 63  |..,...,.......Oc|
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

**Future**: In future we'd like to add more information to the header. In
particular, we are interested in adding

- offset pointing to octopus manifest
- length of the manifest
- offset pointing to ZIP central directory
- length of the full file

### Detection

We can't rely on some fields of the header. Following table (modified from wikipedia)
explains which fields are guaranteed to be identical between all optimized octopus files.

| Offset | Bytes | Octopus     | ZIP Description                             |
|--------|-------|-------------|---------------------------------------------|
| 0      |   4   | identical   | Local file header signature = 0x04034b50 (PK♥♦ or "PK\3\4") |
| 4      |   2   | any valid   | Version needed to extract (minimum)         |
| 6      |   2   | 0 or 8      | General purpose bit flag                    |
| 8      |   2   | 0           | Compression method; e.g. none = 0, DEFLATE = 8 (or "\0x08\0x00") |
| 10     |   2   | 0           | File last modification time                 |
| 12     |   2   | 33          | File last modification date                 |
| 14     |   4   | valid, 0xf5cae33b in this version | CRC-32 of uncompressed data |
| 18     |   4   | 44 or greater | Compressed size (or 0xffffffff for ZIP64)   |
| 22     |   4   | 44 or greater | Uncompressed size (or 0xffffffff for ZIP64) |
| 26     |   2   | 7           | File name length (n)                        |
| 28     |   2   | 0           | Extra field length (m)                      |
| 30     |   7   | `Octopus`   | File name                                   |
| 30+7   |   0   | empty       | Extra field                                 |
| 37     |   44  | message     | File contents                               |

Therefore detection code must look for:

- file size is at least 134 bytes (smallest possible empty octopus file)
- bytes 0-3 are 0x04034b50 in little-endian
- bytes 8-11 are 0
- byte 12 is 33
- byte 13 is 0
- 18-21 and 22-25 are identical and are at least 44 in little-endian
- bytes 26-29 are 07 00 00 00
- bytes 30+ are "Octopus is universal design format. opendesign.dev." in ASCII

There should be an option not to require this detection in case we want to allow
local modification of octopus files.

*Date note*: zip's date format uses [MS-DOS date format](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-dosdatetimetofiletime).
33 corresponds to 1980/1/1 which is the lowest date possible. It effectively means 0.

**Future**: if extra data is desired at the start of octopus file, we'll add it
into this file. It could be in binary, so you shouldn't parse the whole file as
string. That is also why above does not specify file size and CRC directly.

### Impact

This means a few things. First is that optimized octopus files are trivial to
detect. But, it comes with a cost, which is that it is harder to produce them.
In particular, basic compression utilities do not allow to set file order, nor
set compression on per-file basis. Setting offsets is also non-trivial as it
needs to happen after the whole file is created and the compression utility has
to provide this info.

I propose that we handle this in following fashion:

- provide a way (CLI + API function) to convert octopus files to optimized variant
- but do not accept malformed octopus files in general APIs
- have a special function, something like `loadUnoptimized` to also make it easy
  to load plain octopus zip files.
- end-user-facing tools should handle unoptimized files by showing a warning with
  message like "It seems that this file was modified in external program. Some
  things might break as a result of this.", but load the file anyway.

This is because if we did accept any zip files in general API, this would become
meaningless because they would become the de-facto standard. Accepting any zip
files is a change we can do in minor release, the reverse is not.
