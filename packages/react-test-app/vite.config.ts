import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import packageJson from "./package.json";
// @ts-expect-error
import fs from "node:fs";

// Resolve all local packages directly so that development does not require
// running typescript watcher.
const alias = Object.fromEntries(
  Object.entries(packageJson.dependencies)
    .filter(([k, v]) => k.startsWith("@avocode/") && v.startsWith("workspace:"))
    .map(([k, v]) => {
      const nox = new URL(`../${k.slice(9)}/index.ts`, import.meta.url)
        .pathname;
      return [k, fs.existsSync(nox) ? nox : nox + "x"];
    })
);

export default defineConfig({
  resolve: { alias },
  server: {
    fs: { allow: ["../.."] },
  },
  plugins: [react()],
});
