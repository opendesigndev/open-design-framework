import childProcess from "child_process";
import fs from "fs";
import path from "path";

const dir = new URL(".", import.meta.url).pathname;
const rev = run("git rev-parse --short=9 HEAD".split(" ")).trim();
const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
// Inspired by reacts experimental versioning nomenclature.
const version = `0.0.0-experimental-${rev}-${date}`;

const pkgDirs = new Map();

// Map directory names to package names
for (const pkg of fs.readdirSync(path.join(dir, "packages"))) {
  const jsonPath = path.join(dir, "packages", pkg, "package.json");
  try {
    const json = JSON.parse(fs.readFileSync(jsonPath));
    if (!json.private) pkgDirs.set(json.name, pkg);
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}

// Collect local dependencies of a package
const pkgs =
  process.argv[2] === "all"
    ? Array.from(pkgDirs.keys())
    : Array.from(new Set(process.argv.slice(2).map(localDepsOf).flat()));
if (pkgs.length < 1)
  throw new Error("You must provide a package as a first argument");
console.log("I'll do release", version, "of:", pkgs.join(", "));

// Modify package.json to set a version and depend on correct version
for (const pkg of pkgs) {
  const jsonPath = path.join(dir, "packages", pkgDirs.get(pkg), "package.json");
  // If backup exists, then previous run probably crashed. Restore it first.
  if (fs.existsSync(jsonPath + ".backup")) {
    fs.copyFileSync(jsonPath + ".backup", jsonPath);
  }
  fs.copyFileSync(jsonPath, jsonPath + ".backup");

  const json = JSON.parse(fs.readFileSync(jsonPath));
  json.version = version;
  for (const key of Object.keys(json.dependencies || {})) {
    if (pkgDirs.has(key)) {
      json.dependencies[key] = version;
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2));
}

// Create tarballs. I do this instead of direct release to avoid release in case
// of errors.
for (const pkg of pkgs) {
  console.log("Running yarn pack on", pkg);
  run(["yarn", "pack", "--filename", "experimental.tgz"], {
    stdio: ["ignore", "inherit", "inherit"],
    cwd: path.join(dir, "packages", pkgDirs.get(pkg)),
  });
}

// Do the publish
for (const pkg of pkgs) {
  console.log("Publishing", pkg);
  run(
    [
      "npm",
      "publish",
      "experimental.tgz",
      "--tag",
      "experimental",
      "--access",
      "public",
    ],
    {
      stdio: ["ignore", "inherit", "inherit"],
      cwd: path.join(dir, "packages", pkgDirs.get(pkg)),
    },
  );
}

// Cleanup - restore package.json backups, remove backups, remove tarballs
for (const pkg of pkgs) {
  const jsonPath = path.join(dir, "packages", pkgDirs.get(pkg), "package.json");
  fs.copyFileSync(jsonPath + ".backup", jsonPath);
  fs.rmSync(jsonPath + ".backup");
  fs.rmSync(path.join(dir, "packages", pkgDirs.get(pkg), "experimental.tgz"));
}

// Done.

function run(args, opts) {
  const res = childProcess.spawnSync(args[0], args.slice(1), {
    stdio: ["ignore", "pipe", "inherit"],
    encoding: "utf-8",
    env: process.env,
    ...opts,
  });
  if (res.status !== 0)
    throw new Error(args[0] + " exited with non-zero code " + res.status);
  return res.stdout;
}

function localDepsOf(pkg) {
  const pkgDir = pkgDirs.get(pkg);
  if (!pkgDir) return [];
  const jsonPath = path.join(dir, "packages", pkgDir, "package.json");
  const json = JSON.parse(fs.readFileSync(jsonPath));

  let list = [];
  for (const key of Object.keys(json.dependencies)) {
    if (pkgDirs.has(key)) {
      list = list.concat(localDepsOf(key));
    }
  }
  list.push(pkg);
  return list;
}
