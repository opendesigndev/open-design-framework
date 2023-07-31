# @opendesign/react

## 0.7.1

### Patch Changes

- 03e49b3: **breaking**: import functions now return OctopusFile instead of special `ImportedClipboardData`, same for input of `paste`

  - This does not affect you if you only pass the output to input of paste
  - Also, removed `ImportedClipboardData` type export

- Updated dependencies [2d18de5]
- Updated dependencies [03e49b3]
- Updated dependencies [9365ec5]
  - @opendesign/universal@0.9.0

## 0.7.0

### Minor Changes

- cabc4fb: Added layer scaling method

### Patch Changes

- c70d5be: add readme
- ab2575d: specify license in package.json
- Updated dependencies [c70d5be]
- Updated dependencies [ab2575d]
- Updated dependencies [cabc4fb]
  - @opendesign/universal@0.8.0

## 0.6.1

### Patch Changes

- Updated dependencies [6b9fb58]
- Updated dependencies [13e0af4]
- Updated dependencies [784c3c9]
- Updated dependencies [044ed89]
- Updated dependencies [2d688f4]
- Updated dependencies [784c3c9]
- Updated dependencies [784c3c9]
  - @opendesign/universal@0.7.0

## 0.6.0

### Minor Changes

- e5082ca: Added transform layer methods and key/pointer handlers for react

### Patch Changes

- Updated dependencies [c2e71f1]
- Updated dependencies [42e03b0]
- Updated dependencies [38f84a4]
- Updated dependencies [8737829]
- Updated dependencies [e5082ca]
  - @opendesign/universal@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [cea316d]
  - @opendesign/universal@0.5.1

## 0.5.0

### Minor Changes

- 1c55c63: implemented children prop on EditorCanvas
- 5db2f68: implement RelativeMarker component
- f59f836: implemented onClick prop of EditorCanvas

### Patch Changes

- c52196a: Added event listener for internal paste method for proper layer list update
- Updated dependencies [358e361]
- Updated dependencies [568e34e]
- Updated dependencies [f59f836]
- Updated dependencies [1c55c63]
- Updated dependencies [5db2f68]
- Updated dependencies [c52196a]
- Updated dependencies [08fd4f1]
  - @opendesign/universal@0.5.0

## 0.4.1

### Patch Changes

- 7acdfc1: fix release process
- Updated dependencies [7acdfc1]
  - @opendesign/universal@0.4.1

## 0.4.0

### Minor Changes

- c0529ae: Added custom hook for layer list in react. Change options for getLayers to object

### Patch Changes

- Updated dependencies [da048cc]
- Updated dependencies [b04bf48]
- Updated dependencies [8fe0577]
- Updated dependencies [0452c23]
- Updated dependencies [d54af2b]
- Updated dependencies [e445a22]
- Updated dependencies [02929ce]
- Updated dependencies [04514f3]
- Updated dependencies [f388b6d]
- Updated dependencies [c4e296d]
- Updated dependencies [c0529ae]
- Updated dependencies [563ffae]
  - @opendesign/universal@0.4.0

## 0.3.0

### Minor Changes

- 79844b8: paste event handling code now passes unknown data along and allows octopus component to be pasted directly
- 79844b8: when pasting before first arboard is created, paste will become the new artboard instead of creating artboard and pasting there

### Patch Changes

- 79844b8: updated engine and added better error handling for octopus parse errors
- 79844b8: updated octopus-fig improving figma feature support
- Updated dependencies [79844b8]
- Updated dependencies [79844b8]
- Updated dependencies [79844b8]
- Updated dependencies [79844b8]
  - @opendesign/universal@0.3.0

## 0.2.2

### Patch Changes

- fix the release process
- Updated dependencies
  - @opendesign/universal@0.2.2

## 0.2.0

### Minor Changes

- 86cca2a: add option to disable gestures on canvas
- dd7b75a: Added various features allowing to implement paste at cursor.

  - added onPointerMove event on EditorCanvas component
  - fixed example in usePaste documentation
  - universal/dom: added extractEventPosition to return value
  - added paste method to ArtboardNode
  - added paste methods to LayerNode
  - added getRootLayer method to ArtboardNode
  - added createLayer method to LayerNode taking octopus
  - the above allows you to customize paste including creating intermediary layer
    with required offset.

### Patch Changes

- f1ed2f4: fix content disappearing on canvas resize
- Updated dependencies [f1ed2f4]
- Updated dependencies [86cca2a]
- Updated dependencies [dd7b75a]
  - @opendesign/universal@0.2.0

## 0.1.0

### Minor Changes

- 6abda1b: - Added usePaste hook
  - Removed `importFromClipboard` reexport from `@opendesign/react`
- de103e1: Added unstable APIs to set static animation
- 9b12016: add features neccesary to integrate in animation tool
  - react: reexport universal at '@opendesign/react/universal'
    - We will aim for you to not need this but it is there so that you do not
      have to have install two packages and deal with check versioning.
  - universal: added support for static animations: setting and playing
    - note: most of the APIs use milliseconds, but format is in seconds, this
      will change (we'll either add builder in ms, or change everything else to s)
  - universal: added events - play, pause, timeupdate
  - universal: added dimensions to artboard
  - universal: added way to read octopus of an artboard (this is a stopgap until we
    add proper introspection for more details)
  - universal: added loading flag to editor

### Patch Changes

- Updated dependencies [a50e4f7]
- Updated dependencies [de103e1]
- Updated dependencies [9b12016]
- Updated dependencies [809b28c]
  - @opendesign/universal@0.1.0
