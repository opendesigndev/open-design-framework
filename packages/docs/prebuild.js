import { createRequire } from "node:module";
import fs from "fs";
import path from "path";
const require = createRequire(import.meta.url);

const list = [["@opendesign/engine", { keep: ["tsconfig.json"] }]];
const refs = {};

for (const [packageName, conf] of list) {
  const base = pkgRoot(packageName);
  console.log(base);
  const target = new URL(
    path.join("external", packageName.split("/").slice(-1)[0]),
    import.meta.url,
  ).pathname;
  refs[packageName] = target;
  fs.mkdirSync(target, { recursive: true });
  for (const file of fs.readdirSync(target)) {
    if (!conf.keep.includes(file)) {
      rm(path.join(target, file));
    }
  }
  for (const file of fs.readdirSync(base)) {
    fs.cpSync(path.join(base, file), path.join(target, file), {
      recursive: true,
    });
  }
}

const pkgJson = path.join(refs["@opendesign/engine"], "package.json");
const json = JSON.parse(fs.readFileSync(pkgJson));
json["typings"] = "./ode.d.ts";
fs.writeFileSync(pkgJson, JSON.stringify(json));

function rm(target) {
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    for (const file of fs.readdirSync(target)) {
      rm(path.join(target, file));
    }
    fs.rmdirSync(target);
  } else {
    fs.rmSync(target, { force: true });
  }
}

function pkgRoot(pkgName) {
  const src = require.resolve(pkgName);
  const index = src.lastIndexOf(pkgName);
  if (index < 0) return src.split("/").slice(0, -1).join("/");
  return src.substring(0, index + pkgName.length);
}
