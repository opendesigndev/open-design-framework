import { parseArgs } from "node:util";

import { expectedError } from "./utils.js";

export function execute(args: string[]) {
  const { values: options } = parseArgs({
    args,
    options: {
      input: { type: "string", short: "i" },
      output: { type: "string", short: "o" },
    },
  });
  if (!options.input || !options.output) {
    throw expectedError("Missing input or output file");
  }
  throw expectedError("Not implemented");
}

export function help() {
  console.log(`Usage: opendesign embed-fonts [options]

Options:
  -i, --input   Path to input file
  -o, --output  Path to output file
`);
}
