import { createConverter, XDFileReader } from "@avocode/octopus-xd";

import { MemoryExporter } from "./memory-exporter.js";

export async function importFile(data: Uint8Array) {
  const reader = new XDFileReader({ file: data });
  const sourceDesign = await reader.sourceDesign;
  if (sourceDesign === null) {
    throw Error("Creating SourceDesign Failed");
  }
  const converter = createConverter({ sourceDesign });
  const exporter = new MemoryExporter();
  await converter.convertDesign({ exporter });
  const dir = await exporter.completed();
  await reader.cleanup();
  return dir;
}
