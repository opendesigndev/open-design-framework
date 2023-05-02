import fs from "node:fs";

import type * as AItypes from "@opendesign/octopus-ai";
import * as AIpkg from "@opendesign/octopus-ai";

import { MemoryFileExporter } from "./memory-file-exporter.js";

/**
 * Currently, our AI importer has a limitation that it can only load files from
 * the filesystem, so it can't be used in the browser. This export is a workaround
 * for that issue and will be removed once that limitation is removed.
 *
 * @param path
 * @returns
 */
export async function importIllustratorFile(path: string) {
  const AI: typeof AItypes = AIpkg as any;

  const reader = new AI.AIFileReader({ path });
  const sourceDesign = await reader.getSourceDesign();
  if (sourceDesign === null) {
    throw Error("Creating SourceDesign Failed");
  }
  const converter = AI.createConverter({});
  const exporter = new MemoryFileExporter();
  await converter.convertDesign({ sourceDesign, exporter });
  const dir = await exporter.completed();
  await reader.cleanup();
  return dir;
}
