import { importXDFile } from "./importer-xd.js";

export async function importFile(data: Uint8Array) {
  return importXDFile(data);
}
