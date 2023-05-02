import type { Manifest } from "@opendesign/manifest-ts";

import type { OctopusFile } from "../octopus-file/octopus-file.js";
import { InMemoryOctopusFile } from "../octopus-file/read-octopus-file.js";
import type { DetachedPromiseControls } from "../utils.js";
import { detachPromiseControls } from "../utils.js";

// TODO: import from octopus
type ComponentConversionResult = any;

export class MemoryExporter {
  private _completed: DetachedPromiseControls<OctopusFile> =
    detachPromiseControls();
  private _file: OctopusFile = new InMemoryOctopusFile();
  private _hasManifest = false;

  async completed() {
    return this._completed.promise;
  }

  finalizeExport(): void {
    if (!this._hasManifest) {
      this._completed.reject(new Error("Missing manifest"));
    } else {
      this._completed.resolve(this._file);
    }
  }

  async exportComponent(
    artboard: ComponentConversionResult,
  ): Promise<string | null> {
    if (!artboard.value) return Promise.resolve(null);
    const path = `octopus-${artboard.id}.json`;
    this._file.writeText(path, JSON.stringify(artboard.value));
    return path;
  }

  async exportImage(name: string, data: Uint8Array): Promise<string> {
    const path = "images/" + name;
    this._file.writeBinary(path, data);
    return path;
  }

  async exportManifest(
    manifest: Manifest["schemas"]["OctopusManifest"],
  ): Promise<void> {
    this._hasManifest = true;
    this._file.writeManifest(manifest);
  }
}
