import type { Manifest } from "@opendesign/manifest-ts";
import { createConverter, SourcePluginReader } from "@opendesign/octopus-fig";
import type { Octopus } from "@opendesign/octopus-ts";

import { hashString } from "../utils.js";
import { MemoryExporter } from "./memory-exporter.js";

export type ImportedClipboardData = {
  manifest: Manifest["schemas"]["OctopusManifest"];
  files: (
    | {
        type: "JSON";
        path: string;
        data: Octopus["schemas"]["OctopusComponent"];
        source?: string;
      }
    | { type: "BINARY"; path: string; data: Uint8Array }
  )[];
};

/**
 * Parses data from clipboard into structure of a .octopus file. Depending on
 * the source of pasted data, some information might filled for it to be
 * complete .octopus.
 *
 * If you are in browser, you probably want to use `importFromClipboard` instead.
 *
 * @returns object representing parsed .octopus file, or null if input data is not available or not in correct shape
 */
export async function importFromClipboardData(
  data: string | undefined,
): Promise<ImportedClipboardData | null> {
  if (!data) return null;
  const parsedData = tryJsonParse(data);
  if (!parsedData) return null;
  if (parsedData.type === "OCTOPUS_COMPONENT") {
    // TODO: inspect closer that data is octopus
    return {
      manifest: {
        chunks: [],
        components: [
          {
            dependencies: [],
            id: parsedData.id,
            location: { type: "RELATIVE", path: "octopus.json" },
            name: "Pasted Octopus",
          },
        ],
        libraries: [],
        origin: { name: "Octopus", version: parsedData.version },
        pages: [
          {
            id: (await hashString(data)) ?? "Page",
            children: [{ type: "COMPONENT", id: parsedData.id }],
            name: "Pasted Page",
          },
        ],
        version: "3.0.1",
      },
      files: [
        { type: "JSON", path: "octopus.json", data: parsedData, source: data },
      ],
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
