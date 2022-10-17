// @ts-expect-error
import fs from "node:fs";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import packageJson from "./package.json";

// TODO: remove once usage starts giving errors (= vite fixes its typedefs)
function hackDefault<T>(v: { default: T }): T {
  return v as any;
}

const localDeps = Object.entries(packageJson.dependencies)
  .filter(([k, v]) => k.startsWith("@avocode/") && v.startsWith("workspace:"))
  .map(([k]) => k);

// Resolve all local packages directly so that development does not require
// running typescript watcher.
const alias = Object.fromEntries(
  localDeps.map((k) => {
    const nox = new URL(`../${k.slice(9)}/index.ts`, import.meta.url).pathname;
    return [k, fs.existsSync(nox) ? nox : nox + "x"];
  })
);

export default defineConfig({
  optimizeDeps: { exclude: localDeps },
  resolve: {
    alias: {
      ...alias,
      // bypass package.json['import'] for @opendesign/universal too
      "#env": new URL("../opendesign-universal/src/env-dom.ts", import.meta.url)
        .pathname,
    },
  },
  server: {
    fs: { allow: ["../.."] },
  },
  plugins: [hackDefault(react)()],
});
