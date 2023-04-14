import * as fs from "node:fs/promises";
import { parseArgs } from "node:util";

import { importFile } from "@opendesign/universal";

import { expectedError } from "./utils.js";

export async function execute(args: string[]) {
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
  const output = await importFile(await fs.readFile(options.input));
  await fs.writeFile(options.output, output);
}

export function help() {
  console.log(`Usage: opendesign convert [options]

Options:
  -i, --input   Input file
  -o, --output  Output file

Converts a design file to .octopus format.
`);
}
