# Contributing

This file will contain a guide on how to build and test changes to this repo.

## Installing dependencies

You should have [corepack](https://nodejs.org/api/corepack.html) setup so that
you always use correct yarn version. Corepack gets installed automatically with
node.js. To check if you have it **enabled** run `yarn -v` in this repository.
If it outputs version greater than 3 then you are set. Otherwise you have to run
`corepack enable` (potentially with sudo). You only have to do this once.

Following paragraph only applies before we open-source this repository:
Then, you have to be logged in to npm **via yarn** to be able to access private
npm packages like [@avocode/ode-animation-wasm](https://npm.im/@avocode/ode-animation-wasm).
To check that you can run `yarn npm whoami`. To login run `yarn npm login`.
I recommend running those commands inside this repository too, so that they run
using the correct yarn version.

The you can run `yarn` to install dependencies. Do not be alarmed that no
`node_modules` folder is produced - this is correct. We use pnp with `globalCacheFolder`
enabled to deduplicate dependencies between projects and consume less disk space.
You can clear this folder by running `yarn cache clean --all`.

## Visual Studio Code

If you are using vscode you'll want to generate wrappers to make autocomplete
work. You can do this by running:

```bash
yarn dlx @yarnpkg/sdks vscode
```

See [yarn's documentation](https://yarnpkg.com/getting-started/editor-sdks/) for
more information. We'll likely commit those files to the repo in future, but
right now I don't want to pollute git history while we are figuring things out.

Then you'll want to switch to workspace's typescript version:

- open the repository in vscode
- open any typescript file
- ctrl-shift-p (or ⌘-shift-p on mac) and run `typescript: select typescript version...` and choose `Use workspace version`
