import { crypto } from "@opendesign/env";
import * as fflate from "fflate";

import type { DetachedPromiseControls } from "../utils.js";
import { detachPromiseControls } from "../utils.js";
import { headerContent, headerFile } from "./detect.js";
import { mergeUint8Arrays } from "./octopus-file-utils.js";

// TODO: import from octopus
type ArtboardConversionResult = any;
type DesignConversionResult = any;
type SourceArtboard = unknown;
interface IExporter {
  getBasePath(): Promise<string>;
  finalizeExport(): void;
  exportArtboard(
    _: SourceArtboard,
    artboard: ArtboardConversionResult,
  ): Promise<string | null>;
  exportImage(name: string, data: Uint8Array): Promise<string>;
  exportManifest(manifest: DesignConversionResult): Promise<string>;
}

export class MemoryFileExporter implements IExporter {
  private _zip: fflate.Zip;
  private _chunks: Uint8Array[] = [];
  private _completed: DetachedPromiseControls<Uint8Array>;

  static IMAGES_DIR_NAME = "images";
  static OCTOPUS_MANIFEST_NAME = "octopus-manifest.json";

  constructor() {
    this._zip = new fflate.Zip((err, chunk, final) => {
      this._chunks.push(chunk);
      if (err) {
        this._completed.reject(err);
      } else if (final) {
        const chunks = this._chunks;
        this._chunks = [];

        this._completed.resolve(mergeUint8Arrays(chunks));
      }
    });
    this._completed = detachPromiseControls();
    const file = new fflate.ZipPassThrough(headerFile);
    this._zip.add(this._handleFile(file));
    const headerContentU8 = fflate.strToU8(headerContent);
    file.push(headerContentU8, true);

    // modify so that flag is 0 and we have proper length at the start
    const view = new DataView(this._chunks[0].buffer);
    view.setUint16(6, 0);
    view.setUint32(14, file.crc, true);
    view.setUint32(18, headerContentU8.byteLength, true);
    view.setUint32(22, headerContentU8.byteLength, true);
  }

  private _handleFile(file: fflate.ZipInputFile) {
    file.mtime = new Date("1/1/1980");
    return file;
  }

  private _stringify(value: unknown) {
    return JSON.stringify(value, null, "  ");
  }

  async save(name: string | null, body: string | Uint8Array) {
    if (name === headerFile) {
      if (body !== headerContent)
        throw new Error("Octopus file must contain correct message");
      return name;
    }
    const fullPath = typeof name === "string" ? name : crypto.randomUUID();

    if (typeof body === "string") {
      const data = fflate.strToU8(body);
      // Text file - compress
      const file = new fflate.ZipDeflate(fullPath, { level: 9 });
      this._zip.add(this._handleFile(file));
      file.push(data, true);
    } else {
      // Binary file - do not compress
      const file = new fflate.ZipPassThrough(fullPath);
      this._zip.add(this._handleFile(file));
      file.push(body, true);
    }
    return fullPath;
  }

  async getBasePath(): Promise<string> {
    return "";
  }

  async completed() {
    return this._completed.promise;
  }

  finalizeExport(): void {
    this._zip.end();
  }

  exportArtboard(
    _: SourceArtboard,
    artboard: ArtboardConversionResult,
  ): Promise<string | null> {
    if (!artboard.value) return Promise.resolve(null);
    return this.save(
      `octopus-${artboard.id}.json`,
      this._stringify(artboard.value),
    );
  }

  exportImage(name: string, data: Uint8Array): Promise<string> {
    return this.save(
      MemoryFileExporter.IMAGES_DIR_NAME + "/" + name.split("/").slice(-1)[0],
      data,
    );
  }

  async exportManifest(manifest: DesignConversionResult): Promise<string> {
    return this.save(
      MemoryFileExporter.OCTOPUS_MANIFEST_NAME,
      this._stringify(manifest.manifest),
    );
  }
}
