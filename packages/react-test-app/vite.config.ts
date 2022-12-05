// @ts-expect-error
import fs from "node:fs";
// @ts-expect-error
import { createRequire } from "node:module";
// @ts-expect-error
import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import packageJson from "./package.json";

const require = createRequire(import.meta.url);

// TODO: remove once usage starts giving errors (= vite fixes its typedefs)
function hackDefault<T>(v: { default: T }): T {
  return v as any;
}

const localDeps = Object.entries(packageJson.dependencies)
  .filter(([k, v]) => v.startsWith("workspace:"))
  .map(([k]) => k);

// Resolve all local packages directly so that development does not require
// running typescript watcher.
const alias = Object.fromEntries(
  localDeps.map((k) => {
    const nox = new URL(
      `../${k.slice(1).replace("/", "-")}/index.ts`,
      import.meta.url
    ).pathname;
    return [k, fs.existsSync(nox) ? nox : nox + "x"];
  })
);

export default defineConfig({
  optimizeDeps: { exclude: [...localDeps] },
  resolve: { alias },
  server: {
    fs: {
      allow: ["../..", path.join(require.resolve("@opendesign/engine"), "..")],
    },
  },
  plugins: [
    {
      // Replaces package/dist local imports with package/src/...tsx import
      // only required in monorepo to avoid having to build any local deps
      name: "custom-local-resolver",
      resolveId(source, importer, options) {
        if (!importer) return;
        if (source.startsWith("#")) {
          const path = importer.replace(
            /(\/packages\/[^/]+)\/.*$/,
            "$1/package.json"
          );
          if (!path.endsWith("package.json")) return;
          const pkgjson = JSON.parse(fs.readFileSync(path, "utf-8"));
          const map = pkgjson.imports?.[source];
          return path
            .replace(/package\.json$/, map.default.slice(7))
            .replace(/\.js$/, ".ts");
        }
        if (source.endsWith("index.ts/dom")) {
          return source.replace("index.ts/dom", "src/dom.ts");
        }
      },
    },
    hackDefault(react)(),
  ],
});
