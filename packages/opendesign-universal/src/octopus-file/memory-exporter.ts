import * as fflate from "fflate";

import { generateUUID } from "../internals.js";

// TODO: import from octopus
type ArtboardConversionResult = any;
type DesignConversionResult = any;
type SourceArtboard = unknown;
type DetachedPromiseControls<T> = {
  resolve: (v: T) => void;
  reject: (err: any) => void;
  promise: Promise<T>;
};
function detachPromiseControls<T>(): DetachedPromiseControls<T> {
  let resolve!: (v: T) => void;
  let reject!: (err: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export class MemoryExporter {
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

        const merged = new Uint8Array(
          chunks.reduce((v, chunk) => v + chunk.length, 0)
        );
        let offset = 0;
        for (const chunk of chunks) {
          merged.set(chunk, offset);
          offset += chunk.length;
        }

        this._completed.resolve(merged);
      }
    });
    this._completed = detachPromiseControls();
    const file = new fflate.ZipPassThrough("Octopus");
    this._zip.add(file);
    file.push(
      fflate.strToU8(" is universal design format. opendesign.dev."),
      true
    );
  }

  private _stringify(value: unknown) {
    return JSON.stringify(value, null, "  ");
  }

  private async _save(name: string | null, body: string | Uint8Array) {
    const fullPath = typeof name === "string" ? name : generateUUID();

    if (typeof body === "string") {
      const data = fflate.strToU8(body);
      // Text file - compress
      const file = new fflate.ZipDeflate(fullPath, { level: 9 });
      this._zip.add(file);
      file.push(data, true);
    } else {
      // Binary file - do not compress
      const file = new fflate.ZipPassThrough(fullPath);
      this._zip.add(file);
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
    artboard: ArtboardConversionResult
  ): Promise<string | null> {
    if (!artboard.value) return Promise.resolve(null);
    return this._save(
      `octopus-${artboard.id}.json`,
      this._stringify(artboard.value)
    );
  }

  exportImage(name: string, data: Uint8Array): Promise<string> {
    return this._save(
      MemoryExporter.IMAGES_DIR_NAME + "/" + name.split("/").slice(-1)[0],
      data
    );
  }

  async exportManifest(manifest: DesignConversionResult): Promise<string> {
    return this._save(
      MemoryExporter.OCTOPUS_MANIFEST_NAME,
      this._stringify(manifest.manifest)
    );
  }
}
