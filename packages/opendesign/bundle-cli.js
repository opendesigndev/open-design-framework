import * as esbuild from "esbuild";
import builtin from "builtin-modules/static.js";

await esbuild.build({
  entryPoints: ["cli/cli.ts"],
  bundle: true,
  outdir: "dist/cli",
  platform: "node",
  splitting: true,
  format: "esm",
  minify: true,
  define: { "process.env.NODE_ENV": '"production"' },
  external: [
    ...builtin,
    "@opendesign/engine-wasm",
    // jsdom is not a true external, but should not be needed
    "jsdom",
  ],
  banner: {
    js: `const require = (await import('module')).createRequire(import.meta.url);`,
  },
});
