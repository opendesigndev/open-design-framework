import { importIllustratorFile } from "./importer-ai.js";
import { importXDFile } from "./importer-xd.js";

export async function importFile(data: Uint8Array) {
  // return importIllustratorFile(data);
  return importXDFile(data);
}
