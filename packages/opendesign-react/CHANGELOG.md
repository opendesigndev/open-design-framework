# @opendesign/react

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
