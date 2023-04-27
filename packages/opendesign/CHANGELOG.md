# OpenDesign CLI

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
