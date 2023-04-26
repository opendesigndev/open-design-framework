# Contributing

This file will contain a guide on how to build and test changes to this repo.

## Installing dependencies

You should have [corepack](https://nodejs.org/api/corepack.html) setup so that
you always use correct yarn version. Corepack gets installed automatically with
node.js. To check if you have it **enabled** run `yarn -v` in this repository.
If it outputs version greater than 3 then you are set. Otherwise you have to run
`corepack enable` (potentially with sudo). You only have to do this once.

Then you can run `yarn` to install dependencies. Do not be alarmed that no
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
more information.

Then you'll want to switch to workspace's typescript version:

- open the repository in vscode
- open any typescript file
- ctrl-shift-p (or ⌘-shift-p on mac) and run `typescript: select typescript version...` and choose `Use workspace version`

## Notes

- If your typescript `type` has methods, change it to interface. It renders
  better in typedoc.
- Same applies for type inheritance (nodes).

## Tips

To develop OpenDesign CLI run `yarn workspace opendesign vite`. You likely
want to use some local designs - just put them into `designs` folder in
`opendesign`, or put a symlink there. You can then append `?file=filename`
parameter to vite's url to open it (eg. http://localhost:5173/?file=prototype.xd)

## Release process

We have an automated release process. Make your changes, run `yarn changeset`,
write a changelog and commit the changelog in the same commit as your changes.

**Experimental releases** Then, once it hits `main` branch, it will be
automatically released as experimental version. See summary of experimental
action (can be accessed via checkmark next to the commit) for resulting version
names. This same workflow can also be triggered manually using following command:

```bash
gh workflow run "Experimental Release" --ref branch-name
```

Lastly, it can be also triggered from [this page](https://github.com/opendesigndev/open-design-framework/actions/workflows/experimental-release.yml). You can then open the workflow summary to see instructions on how to use the experimental packages in product or via `npx` (for CLI).

You should not use those experimental releases in product, but they are good way
to test the changes *before* you cut a stable release.

**Stable release** To create a stable release first test it in a product using
the experimental release and then merge automated PR titled "Version Packages"
into `main`. It will: update changelogs, publish to npm, create github releases.
See [changesets documentation](https://github.com/changesets/changesets) for more details.

**Local testing** Sometimes, you want to test your changes locally without having to publish them
to github and npm. To do that (within projects using yarn 3+) you can run
`node make-linkable.js` and then change the dependency version to something
similar to

```json
"@opendesign/react": "portal:../open-design-framework/packages/opendesign-react"
```

and run yarn. Depending on your setup, you might also have to have `yarn tsc -b --watch`
running in this repository. Note that you should not commit changes made by the
`make-linkable` script.
