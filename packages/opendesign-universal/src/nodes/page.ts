import type { EditorImplementation } from "../editor.js";
import type { Engine } from "../engine/engine.js";
import { loadPastedImages } from "../engine/load-images.js";
import { todo } from "../internals.js";
import type { OctopusFile } from "../octopus-file/octopus-file.js";
import type { ArtboardNode, LayerListItem } from "./artboard.js";
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
  paste(data: OctopusFile): Promise<void>;
}

type AbortSignal = any;

export class PageNodeImpl extends BaseNodeImpl implements PageNode {
  #engine: Engine;
  #editor: EditorImplementation;
  // TODO: make private
  __artboard?: ArtboardNodeImpl;
  // TODO: call this on page destroy
  #destroySignal?: AbortSignal;
  layers: LayerListItem | null = null;

  constructor(engine: Engine, editor: EditorImplementation) {
    super();
    this.#engine = engine;
    this.#editor = editor;
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

  async paste(data: OctopusFile) {
    let artboard = this.__artboard;
    if (!artboard) {
      const octopusPath = data.manifest.components[0]?.location.path;
      if (!octopusPath)
        throw new Error("Pasted data do not contain any design component");
      const octopus = JSON.parse(await data.readText(octopusPath));
      const id = octopus.data.id;
      artboard = new ArtboardNodeImpl(
        this.#engine,
        id,
        octopus.source ?? JSON.stringify(octopus.data),
        this.#editor,
      );
      this.__artboard = artboard;

      await loadPastedImages(this.#engine, data);

      this.#engine.redraw();
      return;
    }
    return artboard.paste(data);
  }
}
