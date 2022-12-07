import type { DetachedPromiseControls } from "../utils.js";
import { detachPromiseControls } from "../utils.js";

// TODO: import from octopus
type ComponentConversionResult = any;
type DesignConversionResult = any;

export class MemoryExporter {
  private _completed: DetachedPromiseControls<{
    manifest?: DesignConversionResult;
    components: Map<string, string>;
    images: Map<string, Uint8Array>;
  }> = detachPromiseControls();
  private _manifest: DesignConversionResult;
  private _components = new Map<string, string>();
  private _images = new Map<string, Uint8Array>();

  private _stringify(value: unknown) {
    return JSON.stringify(value, null, "  ");
  }

  async completed() {
    return this._completed.promise;
  }

  finalizeExport(): void {
    const manifest = this._manifest;
    this._completed.resolve({
      manifest,
      components: this._components,
      images: this._images,
    });
  }

  async exportComponent(
    artboard: ComponentConversionResult
  ): Promise<string | null> {
    if (!artboard.value) return Promise.resolve(null);
    const filename = `octopus-${artboard.id}.json`;
    this._components.set(filename, this._stringify(artboard.value));
    return filename;
  }

  async exportImage(name: string, data: Uint8Array): Promise<string> {
    const path = "images/" + name;
    this._images.set(path, data);
    return path;
  }

  async exportManifest(manifest: DesignConversionResult): Promise<void> {
    this._manifest = manifest;
  }
}
