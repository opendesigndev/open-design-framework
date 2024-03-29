import * as fs from "node:fs/promises";
import { parseArgs } from "node:util";

import {
  importFile,
  importFromClipboardData,
  readOctopusFile,
} from "@opendesign/universal";
import {
  importIllustratorFile,
  importPhotoshopFile,
} from "@opendesign/universal/node";

import { embedFonts } from "./embed-fonts.js";
import { expectedError } from "./utils.js";

export const convertOptions = {
  "skip-font-embed": { type: "boolean" },
} as const;

export async function convertFile(
  path: string,
  options: { "skip-font-embed"?: boolean },
) {
  let output: Uint8Array;
  if (path.endsWith(".ai")) {
    output = await importIllustratorFile(path);
  } else if (path.endsWith(".psd")) {
    output = await importPhotoshopFile(path);
  } else if (path.endsWith(".clipboard")) {
    const input = await fs.readFile(path, "utf-8");
    let res = await (await importFromClipboardData(input))?.serialize();
    if (!res) throw expectedError("Failed to import from clipboard data");
    output = res;
  } else {
    const input = await fs.readFile(path);
    output = await importFile(input);
  }
  if (!options["skip-font-embed"]) {
    await embedFonts(readOctopusFile(output));
  }
  return output;
}

export function convertOptionsHelp() {
  return Object.keys(convertOptions)
    .map((v) => `--${v}`)
    .join("\n  ");
}

export async function execute(args: string[]) {
  const { values: options } = parseArgs({
    args,
    options: {
      input: { type: "string", short: "i" },
      output: { type: "string", short: "o" },
      ...convertOptions,
    },
  });
  if (!options.input || !options.output) {
    throw expectedError("Missing input or output file");
  }

  const output = await convertFile(options.input, options);
  await fs.writeFile(options.output, output);
}

export function help() {
  console.log(`Usage: opendesign convert [options]

Options:
  -i, --input        Input file
  -o, --output       Output file
  ${convertOptionsHelp()}

Converts a design file to .octopus format.
`);
}
