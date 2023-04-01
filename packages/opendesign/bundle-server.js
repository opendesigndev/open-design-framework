import * as esbuild from "esbuild";
import builtin from "builtin-modules/static.js";

await esbuild.build({
  entryPoints: ["cli/cli.ts"],
  bundle: true,
  outdir: "cli-dist",
  platform: "node",
  splitting: true,
  format: "esm",
  external: [...builtin, "@opendesign/engine-wasm"],
  banner: {
    js: `const require = (await import('module')).createRequire(import.meta.url);`,
  },
});
