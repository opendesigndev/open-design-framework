import fs from "node:fs";
import { pipeline } from "node:stream/promises";

import { wasm } from "@opendesign/engine-wasm";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import packageJson from "./package.json";

// TODO: remove once usage starts giving errors (= vite fixes its typedefs)
function hackDefault<T>(v: { default: T }): T {
  return v as any;
}

const localDeps = Object.entries(packageJson.devDependencies)
  .filter(([k, v]) => v.startsWith("workspace:"))
  .map(([k]) => k);

// Resolve all local packages directly so that development does not require
// running typescript watcher.
const alias = Object.fromEntries(
  localDeps.map((k) => {
    const nox = new URL(
      `../${k.slice(1).replace("/", "-")}/index.ts`,
      import.meta.url,
    ).pathname;
    return [k, fs.existsSync(nox) ? nox : nox + "x"];
  }),
);

export default defineConfig({
  optimizeDeps: {
    exclude: [...localDeps],
    // NOTE: as of 3rd Feb 2023 vite does not pick up engine updates in dev mode
    // therefore we disable the cache. If you want to reenable cache, test if
    // updating engine works without having to pass --force to vite.
    force: true,
  },
  build: {
    outDir: "dist/editor",
  },
  resolve: { alias },
  server: {
    fs: {
      allow: ["../.."],
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
            "$1/package.json",
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
    {
      name: "fix-local-serve",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (
            new URL(req.url || "/", "file:///").pathname === "/engine/ode.wasm"
          ) {
            res.setHeader("content-type", "application/wasm");
            pipeline(fs.createReadStream(new URL(wasm).pathname), res).then(
              (v) => res.end(),
              (err) => next(err),
            );
          } else next();
        });
      },
    },
  ],
});
