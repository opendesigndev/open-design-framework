import { expectedError } from "./utils.js";

export function execute(args: readonly string[]) {
  expectedError("pack is not implemented yet.");
}

export function help() {
  console.log(`Usage: opendesign pack [options]

Options:
  -m, --manifest  Path to manifest file
  -o, --output    Path to output file

Packs a design specified by a manifest into a .octopus file.
  `);
}
