---
"@opendesign/react": minor
"@opendesign/universal": minor
---

Added various features allowing to implement paste at cursor.

- added onPointerMove event on EditorCanvas component
- fixed example in usePaste documentation
- universal/dom: added extractEventPosition to return value
- added paste method to ArtboardNode
- added paste methods to LayerNode
- added getRootLayer method to ArtboardNode
- added createLayer method to LayerNode taking octopus
- the above allows you to customize paste including creating intermediary layer
  with required offset.
