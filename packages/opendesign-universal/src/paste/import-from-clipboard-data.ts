import { createConverter, SourcePluginReader } from "@opendesign/octopus-fig";

import { MemoryExporter } from "./memory-exporter.js";

export type ImportedClipboardData = {
  _components: Map<string, string>;
  _images: Map<string, Uint8Array>;
};

/**
 * Parses data from clipboard into opaque structure which can then be imported
 * into Editor. Do not rely on structure of returned data.
 *
 * If you are in browser, you probably want to use `importFromClipboard` instead.
 *
 * @returns parsed data, or null if input data is not available or not in correct shape
 */
export async function importFromClipboardData(
  data: string | undefined,
): Promise<ImportedClipboardData | null> {
  if (!data) return null;
  const parsedData = tryJsonParse(data);
  if (!parsedData) return null;
  if (parsedData.type === "ARTBOARD") {
    return {
      _components: new Map([["octopus.json", data]]),
      _images: new Map(),
    };
  }
  if (parsedData.type !== "OPEN_DESIGN_FIGMA_PLUGIN_SOURCE") return null;
  const reader = new SourcePluginReader(parsedData);
  const converter = createConverter();
  const exporter = new MemoryExporter();

  await converter.convertDesign({ designEmitter: reader.parse(), exporter });
  return exporter.completed();
}

function tryJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
