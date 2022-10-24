import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

console.info("Running typescript...");
run("yarn", ["tsc", "-b"]);
console.info("Building docs...");
run("yarn", ["workspace", "docs", "build"]);
console.info("Building react-test-app...");
run("yarn", ["workspace", "react-test-app", "vite", "build"]);
const here = path.dirname(new URL(import.meta.url).pathname);
const testApp = path.join(here, "packages", "react-test-app", "dist");
const docs = path.join(here, "packages", "docs", "dist");
console.info("Creating shared dist...");
fs.rmSync("dist", { force: true, recursive: true });
fs.mkdirSync("dist");
copy(docs, "dist");
copy(testApp, "dist");

/**
 * @param {string} from
 * @param {string} to
 */
function copy(from, to) {
  for (const f of fs.readdirSync(from)) {
    const stat = statIfExists(path.join(to, f));
    if (stat?.isDirectory()) {
      copy(path.join(from, f), path.join(to, f));
    } else {
      fs.renameSync(path.join(from, f), path.join(to, f));
    }
  }
}

/**
 * @param {string} p
 */
function statIfExists(p) {
  try {
    return fs.statSync(p);
  } catch (e) {
    if (e.code === "ENOENT") return null;
    throw e;
  }
}

/**
 *
 * @param {string} cmd
 * @param {readonly string[]} args
 */
function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: ["ignore", "inherit", "inherit"] });
  if (res.status !== 0)
    throw new Error("Command failed: " + cmd + " " + args.join(" "));
}
