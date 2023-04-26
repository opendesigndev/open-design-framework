import fs from "node:fs/promises";
import { parseArgs } from "node:util";

import type { OctopusFile } from "@opendesign/universal";
import { readOctopusFile } from "@opendesign/universal";

import { listSystemFonts } from "./fonts/list-system-fonts.js";
import { expectedError } from "./utils.js";

export async function embedFonts(file: OctopusFile): Promise<boolean> {
  const systemFonts = await listSystemFonts();
  let fontChanged = false;
  for (const components of file.manifest.components) {
    if (!components?.assets?.fonts) continue;
    for (const font of components.assets.fonts) {
      // TODO: font.location.type === "RELATIVE" with empty path probably doe
      // not make sense. Investigate where this comes from and fix it there.
      if (font.location?.type === "RELATIVE" && font.location.path) continue; // already embedded
      if (font.location?.type === "EXTERNAL") {
        // TODO: download and embed
        throw new Error("External fonts are not supported yet");
      }

      if (!font.name) {
        // can't do anything about font without name
        // TODO: maybe be more strict in the spec as font without a name and location
        // likely does not really make sense?
        continue;
      }

      const systemFont = systemFonts.get(font.name.toLowerCase());
      if (!systemFont) {
        console.warn(`⚠ Font ${font.name} not found on the system`);
        // TODO: try and find the font on fontsource.org
        continue;
      }
      const fontData = await fs.readFile(systemFont.file);
      const filename =
        "fonts/" +
        systemFont.file
          .split(/[\\\/]/)
          .slice(-1)[0]
          .replace(/[^a-zA-Z0-9.-_]/g, "-");
      await file.writeBinary(filename, fontData);
      font.location = {
        type: "RELATIVE",
        path: filename,
      };
      fontChanged = true;
    }
  }
  return fontChanged;
}

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
  const file = readOctopusFile(await fs.readFile(options.input));

  if (await embedFonts(file)) {
    await fs.writeFile(options.output, await file.serialize());
  } else {
    await fs.copyFile(options.input, options.output);
  }
}

export function help() {
  console.log(`Usage: opendesign embed-fonts [options]

Options:
  -i, --input   Path to input file
  -o, --output  Path to output file
`);
}
