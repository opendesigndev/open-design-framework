# @opendesign/universal

## 0.4.1

### Patch Changes

- 7acdfc1: fix release process

## 0.4.0

### Minor Changes

- 0452c23: Added method for getting list of layers in artboard
- d54af2b: change ImportedClipboardData and mark it as part of public API
- c4e296d: added support for setting fonts

  - new setFont method on Editor
  - new unstable_fallbackFont option when creating editor

- c0529ae: Added custom hook for layer list in react. Change options for getLayers to object

### Patch Changes

- da048cc: upgraded to new engine version
- b04bf48: update octopus and manifest versions
- 8fe0577: fixed key type for enum decoder function
- e445a22: update engine version
- 02929ce: rewrote destroy function handling to be more automatic
- 04514f3: add a temporary workaround to support octopus files using spec version older than alpha.41
- f388b6d: update octopus-fig
- 563ffae: update octopus-xd

## 0.3.0

### Minor Changes

- 79844b8: paste event handling code now passes unknown data along and allows octopus component to be pasted directly
- 79844b8: when pasting before first arboard is created, paste will become the new artboard instead of creating artboard and pasting there

### Patch Changes

- 79844b8: updated engine and added better error handling for octopus parse errors
- 79844b8: updated octopus-fig improving figma feature support

## 0.2.2

### Patch Changes

- fix the release process
- Updated dependencies
  - @opendesign/env@0.1.1

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
