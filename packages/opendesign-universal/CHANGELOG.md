# @opendesign/universal

## 0.1.0

### Minor Changes

- a50e4f7: - Added a way to convert Adobe XD designs into octopus files
  - Implemented opening of octopus files
  - Changed `url` field to `design`
  - Allowed design field to contain binary design data instead of url string
- de103e1: Added unstable APIs to set static animation
- 9b12016: add features neccesary to integrate in animation tool
  - universal: properly separated renderers so that they do not share extra info
  - universal: added support for static animations: setting and playing
    - note: most of the APIs use milliseconds, but format is in seconds, this
      will change (we'll either add builder in ms, or change everything else to s)
  - universal: added events - play, pause, timeupdate
  - universal: added dimensions to artboard
  - universal: added way to read octopus of an artboard (this is a stopgap until we
    add proper introspection for more details)
  - universal: added loading flag to editor

- 809b28c: - Added a facility to read manifest from octopus file
  - Allowed user to specify which component to load

### Patch Changes

- Updated dependencies [9b12016]
  - @opendesign/env@0.1.0
