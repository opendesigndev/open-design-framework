import { expectedError } from "./utils.js";

export function execute(args: readonly string[]) {
  expectedError("pack is not implemented yet.");
}

export function help() {
  console.log(
    "opendesign pack --manifest path/to/manifest.json --output path/to/file.octopus",
  );
}
