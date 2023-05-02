import { createConverter, XDFileReader } from "@opendesign/octopus-xd";

import { MemoryFileExporter } from "./memory-file-exporter.js";

export async function importXDFile(data: Uint8Array) {
  const reader = new XDFileReader({ file: data });
  const sourceDesign = await reader.sourceDesign;
  if (sourceDesign === null) {
    throw Error("Creating SourceDesign Failed");
  }
  const converter = createConverter({ sourceDesign });
  const exporter = new MemoryFileExporter();
  await converter.convertDesign({ exporter });
  const dir = await exporter.completed();
  await reader.cleanup();
  return dir;
}
