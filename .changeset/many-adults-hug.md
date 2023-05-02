---
"@opendesign/universal": minor
"@opendesign/react": patch
---

**breaking**: import functions now return OctopusFile instead of special `ImportedClipboardData`, same for input of `paste`

- This does not affect you if you only pass the output to input of paste
- Also, removed `ImportedClipboardData` type export
