import { OctopusPSDConverter, PSDFileReader } from "@opendesign/octopus-psd";

import { MemoryFileExporter } from "./memory-file-exporter.js";

/**
 * Currently, our photoshop importer only works in node.js, but we want to be able
 * to use it in the browser. This export is a workaround for that issue and will
 * be removed once that limitation is removed.
 *
 * @param path
 * @returns
 */
export async function importPhotoshopFile(path: string) {
  const reader = new PSDFileReader({ path });
  const sourceDesign = await reader.sourceDesign;
  if (sourceDesign === null) {
    throw Error("Creating SourceDesign Failed");
  }
  const converter = new OctopusPSDConverter({});
  const exporter = new MemoryFileExporter();
  await converter.convertDesign({ exporter, sourceDesign });
  const dir = await exporter.completed();
  await reader.cleanup();
  return dir;
}
