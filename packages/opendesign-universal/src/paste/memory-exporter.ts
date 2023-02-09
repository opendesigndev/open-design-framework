import type { Manifest } from "@opendesign/manifest-ts";

import type { DetachedPromiseControls } from "../utils.js";
import { detachPromiseControls } from "../utils.js";
import type { ImportedClipboardData } from "./import-from-clipboard-data.js";

// TODO: import from octopus
type ComponentConversionResult = any;

export class MemoryExporter {
  private _completed: DetachedPromiseControls<ImportedClipboardData> =
    detachPromiseControls();
  private _manifest?: Manifest["schemas"]["OctopusManifest"];
  private _files: ImportedClipboardData["files"] = [];

  async completed() {
    return this._completed.promise;
  }

  finalizeExport(): void {
    const manifest = this._manifest;
    if (!manifest) throw new Error("Missing manifest");
    this._completed.resolve({
      manifest,
      files: this._files,
    });
  }

  async exportComponent(
    artboard: ComponentConversionResult,
  ): Promise<string | null> {
    if (!artboard.value) return Promise.resolve(null);
    const path = `octopus-${artboard.id}.json`;
    this._files.push({ type: "JSON", path, data: artboard.value });
    return path;
  }

  async exportImage(name: string, data: Uint8Array): Promise<string> {
    const path = "images/" + name;
    this._files.push({ type: "BINARY", path, data: data });
    return path;
  }

  async exportManifest(
    manifest: Manifest["schemas"]["OctopusManifest"],
  ): Promise<void> {
    this._manifest = manifest;
  }
}
