import { createRequire } from "node:module";
import fs from "fs";
import path from "path";
const require = createRequire(import.meta.url);

// copy all files from ODE
const base = path.dirname(require.resolve("@opendesign/engine"));
const target = new URL("engine", import.meta.url).pathname;

for (const file of fs.readdirSync(target)) {
  if (file !== ".gitignore" && file !== "tsconfig.json") {
    fs.rmSync(path.join(target, file), { recursive: true, force: true });
  }
}
for (const file of fs.readdirSync(base)) {
  fs.copyFileSync(path.join(base, file), path.join(target, file));
}
const json = JSON.parse(fs.readFileSync(path.join(target, "package.json")));
json["typings"] = "./ode.d.ts";
fs.writeFileSync(path.join(target, "package.json"), JSON.stringify(json));
