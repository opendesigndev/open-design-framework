---
"@opendesign/env": minor
"@opendesign/react": minor
"@opendesign/universal": minor
---

add features neccesary to integrate in animation tool

- env: requestAnimationFrame and cancelAnimationFrame
- react: reexport universal at '@opendesign/react/universal'
    - We will aim for you to not need this but it is there so that you do not
      have to have install two packages and deal with check versioning.
- universal: properly separated renderers so that they do not share extra info
- universal: added support for static animations: setting and playing
    - note: most of the APIs use milliseconds, but format is in seconds, this
      will change (we'll either add builder in ms, or change everything else to s)
- universal: added events - play, pause, timeupdate
- universal: added dimensions to artboard
- universal: added way to read octopus of an artboard (this is a stopgap until we
  add proper introspection for more details)
- universal: added loading flag to editor
