# @opendesign/react

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
