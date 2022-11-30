# Required features

We need and do not polyfill following browser/nodejs features. If you want to
use ODF on older platform it might not be possible, or you might have to
polyfill/transpile these. Support for older browsers is done on best-effort basis.

This list is also best-effort, but if something important is missing here, we
consider it a bug, so please notify us if you notice something.

## Browser

- [WebGL 2.0](https://caniuse.com/webgl2) - this is a hard requirement for
  getting any output from OD Engine and can't be effectively polyfilled. This
  limits our supported browsers to:
  - Chrome 56 - 25 Jan 2017
  - Edge 79 (first chromium based version) - 15 Jan 2020
  - Safari 15 - 20 Sep 2021
  - Firefox 51 - 24 Jan 2017
  - no IE support
- We will not be mentioning Edge further, unless it differs significantly from Chrome.
- [WebAssembly](https://caniuse.com/wasm) - also required for Engine and not
  easily polyfill-able.
  - Chrome 57 - 9 Mar 2017
  - otherwise better support than WebGL 2.0

### Important versions

- Firefox 52 - last version supported on Windows XP and Vista. If you support
  these, you're on your own, but ODF *might* work there.

## Universal

- crypto.randomUUID ([caniuse](https://caniuse.com/mdn-api_crypto_randomuuid), [nodejs](https://nodejs.org/api/crypto.html#cryptorandomuuidoptions))
  - can be polyfilled
  - nodejs ^14.17.0 || >= 15.6.0
  - Chrome 92 - 20 Jul 2021
  - Safari 15.4 - 14 Mar 2022
  - Firefox 95 - 7 Dec 2021
- globalThis ([caniuse](https://caniuse.com/mdn-javascript_builtins_globalthis))
  - easily polyfilled
  - better supported than crypto.randomUUID, but worse support than WebGL 2.0
- AbortSignal.prototype.throwIfAborted ([caniuse](https://caniuse.com/mdn-api_abortsignal_throwifaborted), [mdn](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/throwIfAborted))
  - easily polyfilled

    ```js
    if (!('throwIfAborted' in AbortSignal.prototype)) {
      AbortSignal.prototype.throwIfAborted = function () {
        if (this.aborted) {
          const err = new Error('')
          err.name = 'AbortError'
          throw err
        }
      }
    }
    ```

  - Chrome 100 - 29 Mar 2022
  - Safari 15.4 - 14 Mar 2022
  - Firefox 97 - 9 Feb 2022
  - nodejs >= 17.3.0

## Node.js

Note: currently, node is not supported. However, we plan to support it in the
future. We plan to support all supported nodejs version, which currently means
nodejs 14, but depending on when we release initial nodejs support we might skip
to 16 or 18 (both reach EOL in 2023). See
[nodejs release schedule](https://github.com/nodejs/Release) for more details.
