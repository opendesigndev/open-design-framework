import type { Engine } from "../engine/engine.js";
import { loadPastedImages } from "../engine/load-images.js";
import { todo } from "../internals.js";
import type { ImportedClipboardData } from "../paste/import-from-clipboard-data.js";
import type { ArtboardNode } from "./artboard.js";
import { ArtboardNodeImpl } from "./artboard.js";
import type { BaseNode, NodeFilter } from "./node.js";
import { BaseNodeImpl } from "./node.js";

export interface PageNode extends BaseNode {
  type: "PAGE";
  id: string;

  createArtboard(): ArtboardNode;

  /**
   * Searches through artboards in this page and returns first match (if any).
   * @param filter
   */
  findArtboard(filter?: NodeFilter<ArtboardNode>): ArtboardNode | null;

  /**
   * Adds data which was previously read from clipboard into the editor.
   *
   * @param data
   */
  paste(data: ImportedClipboardData): Promise<void>;
}

type AbortSignal = any;

export class PageNodeImpl extends BaseNodeImpl implements PageNode {
  #engine: Engine;
  // TODO: make private
  __artboard?: ArtboardNodeImpl;
  // TODO: call this on page destroy
  #destroySignal?: AbortSignal;

  constructor(engine: Engine) {
    super();
    this.#engine = engine;
  }

  type = "PAGE" as const;
  id = "hard-c0ded";

  createArtboard(): ArtboardNode {
    this.__artboard = new ArtboardNodeImpl(this.#engine);
    return this.__artboard;
  }

  findArtboard(
    filter?: NodeFilter<ArtboardNode> | undefined,
  ): ArtboardNode | null {
    if (filter) todo();
    return this.__artboard ?? null;
  }

  async paste(data: ImportedClipboardData) {
    let artboard = this.__artboard;
    if (!artboard) {
      const octopus = data.files.find((f) => f.type === "JSON");
      if (!octopus || octopus.type !== "JSON" || !octopus.data.content)
        throw new Error("Paste data do not contain octopus");
      const id = octopus.data.id;
      artboard = new ArtboardNodeImpl(
        this.#engine,
        id,
        octopus.source ?? JSON.stringify(octopus.data),
      );
      this.__artboard = artboard;

      await loadPastedImages(this.#engine, data);

      this.#engine.redraw();
      return;
    }
    return artboard.paste(data);
  }
}
