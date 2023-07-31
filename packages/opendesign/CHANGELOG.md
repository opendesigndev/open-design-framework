# OpenDesign CLI

## 0.4.0

### Minor Changes

- 2d18de5: added experimental adobe illustrator support, currently node.js-only
- 03e49b3: OpenDesign CLI can now open and convert .ai and .psd files (aside from already supported .xd)

  - this is currently very experimental
  - it also supports special .clipboard files, which can be used to import paste data from figma in more automated workflows

- 9365ec5: added experimental psd support, currently node.js-only

## 0.3.0

### Minor Changes

- 8ddf131: editor now looks a bit nicer
- c135f0c: editor: allow selecting layers from layer list
- cabc4fb: Added layer scaling method

### Patch Changes

- c70d5be: add readme
- ab2575d: specify license in package.json

## 0.2.0

### Minor Changes

- 98dc6a1: convert now automatically embeds fonts from host system (unless disabled using --skip-font-embed)
- 13e0af4: add embed-fonts subcommand to CLI
- 98dc6a1: opendesign open can now use system fonts when converting designs
- 0313af4: added --help and -h options (in addition to help subcommand)

### Patch Changes

- aa142ef: fix opendesign open with relative paths
- 2f36566: embed-fonts now only reports missing fonts once

## 0.1.0

### Minor Changes

- ed17c79: initial version of OpenDesign CLI
- 42e03b0: Reorganize built structure of the package
- 752e1c0: added convert subcommand
