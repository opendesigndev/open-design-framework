# Open Design Framework

We want ODF to be one-stop-shop for everything design file related. Importing designs from popular design formats, showing them in browsers, rendering them to png, you name it. Currently ODF can only a subset of this, but the thing it does should work correctly.

There are multiple interfaces for interacting with ODF:

- opendesign CLI
- @opendesign/universal to be used from node.js or vanillajs in the browser
- @opendesign/react to make it easier to use from react apps

Following features work:

- importing from XD
- copy-pasting from figma (by using a special plugin)
- displaying single artboard of a design in the browser
- it works in node.js and browser
- rudimentary edits

Everything else is a work in progress.

## Quick start

```sh
npx opendesign --help
npx opendesign open file.xd
```

## Dependencies

ODF is built upon other components which are in general more feature-complete. Main building block is the octopus [design format](https://github.com/opendesigndev/octopus-specs) - everything you do in opendesign will interact with this format. To get octopus from popular design formats, we have a set of [converters](https://github.com/opendesigndev/octopus). And finally there is a reference implementation of [engine](https://github.com/opendesigndev/open-design-engine) for rendering the design - be it in the browser, nodejs or as a dynamic library for native projects.
