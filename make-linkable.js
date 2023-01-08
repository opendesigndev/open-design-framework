import childProcess from "child_process";
import fs from "fs";
import path from "path";

const dir = new URL(".", import.meta.url).pathname;
for (const pkg of fs.readdirSync(path.join(dir, "packages"))) {
  const jsonPath = path.join(dir, "packages", pkg, "package.json");
  try {
    const text = fs.readFileSync(jsonPath);
    const obj = JSON.parse(text);
    fixDeps(obj.dependencies);
    fixDeps(obj.devDependencies);
    fixDeps(obj.peerDependencies);
    const newText = JSON.stringify(obj, null, 2) + "\n";
    if (text !== newText) fs.writeFileSync(jsonPath, newText, "utf-8");
  } catch (e) {
    if (e.code !== "ENOENT" && e.code !== "ENOTDIR") throw e;
  }
}

function fixDeps(deps) {
  if (!deps) return;
  for (const key of Object.keys(deps)) {
    if (deps[key] === "workspace:*") {
      deps[key] = "link:../" + key.replace("@", "").replace("/", "-");
    }
  }
}
