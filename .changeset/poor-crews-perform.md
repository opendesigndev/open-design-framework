---
"@opendesign/env": minor
---

proper node.js support

- **breaking** remove `warn` and `performanceNow` functions (they are not needed)
- add WebCrypto export
- export node-fetch as fetch in nodejs
