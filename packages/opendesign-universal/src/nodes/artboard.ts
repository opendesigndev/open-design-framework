import type { ComponentHandle, ComponentMetadata } from "@opendesign/engine";
import { crypto } from "@opendesign/env";
import type { Octopus } from "@opendesign/octopus-ts";

import type { EditorImplementation } from "../editor.js";
import type { Engine } from "../engine/engine.js";
import {
  automaticScope,
  createStringRef,
  readStringRef,
} from "../engine/memory.js";
import { todo } from "../internals.js";
import type { OctopusFile } from "../octopus-file/octopus-file.js";
import type { LayerNode } from "./layer.js";
import { LayerNodeImpl } from "./layer.js";
import type { BaseNode } from "./node.js";
import { BaseNodeImpl } from "./node.js";

export type LayerListItem = {
  id: string;
  name: string;
  type: string;
  layers: LayerListItem[];
  parentId?: string;
};

export type getLayersOptions = {
  naturalOrder?: boolean;
};

export interface ArtboardNode extends BaseNode {
  type: "ARTBOARD";
  /**
   * Returns artboard's position within page. Use setX and setY to change this.
   */
  readonly offset: { x: number; y: number };

  /**
   * Returns artboard's size.
   */
  readonly dimensions: { width: number; height: number };

  /**
   * Sets artboard's position on horizontal axis (how far from left side it is).
   * Relative to page origin.
   * @param value
   */
  setX(value: number): ArtboardNode;
  /**
   * Sets artboard position on vertical axis (how far from top it is).
   * Relative to page origin.
   * @param value
   */
  setY(value: number): ArtboardNode;

  /**
   * Replaces all static animations on this Artboard with given animation json.
   *
   * Static to denote that it is a equivalent to CSS animation - it is declarative,
   * static, timeline-based animation. Not meant for things like directly
   * responding to user interactions (à la react-spring).
   *
   * unstable_ prefix to denote that once we add proper typing we will probably
   * have richer API and that this function will likely start accepting an object.
   * @param animation
   */
  unstable_setStaticAnimation(animation: string): void;

  /**
   * returns octopus json representing the file. Unstable because
   * 1) it does not reflect changes
   * 2) we will add more tailored APIs to read various information about the artboard
   */
  unstable_readOctopus(): string;

  /**
   * Adds data which was previously read from clipboard into the root layer of this artboard.
   *
   * @param data
   */
  paste(data: OctopusFile): Promise<void>;

  /**
   * Returns node representing root layer of this artboard.
   */
  getRootLayer(): LayerNode;

  /**
   * Returns list of all layers in this artboard.
   *
   * By default gets layers in natural order - from top to bottom.
   *
   * @param options
   * @param options.naturalOrder - if true, returns layers in order from top to bottom. For example, background layer will be last.
   * @returns
   */
  getLayers(options?: getLayersOptions): LayerListItem | undefined;

  /**
   * Returns layer corresponding to a given id.
   *
   * @param id
   */
  getLayerById(id: string): LayerNode | null;

  /**
   * Returns ID of a layer or artboard at a position. If no object is there,
   * then it returns null.
   *
   * ```typescript
   * console.log(editor.currentPage.identifyLayer([10, 10]))
   * ```
   *
   * @param position
   */
  identifyLayer(
    position: readonly [number, number],
    radius?: number,
  ): string | null;
}

export class ArtboardNodeImpl extends BaseNodeImpl implements ArtboardNode {
  #engine: Engine;
  #editor: EditorImplementation | undefined;
  // TODO: make private
  __component: ComponentHandle;
  // TODO: make private
  __rootLayerId: string;
  #octopus: string;
  #layersIds: Set<string> = new Set();
  // TODO: it's a workaround for now, we should have a proper API for getting the parent layer of a layer
  #layersParents: Map<string, string> = new Map();

  constructor(
    engine: Engine,
    id: string = crypto.randomUUID(),
    octopus?: string,
    editor?: EditorImplementation,
  ) {
    super();
    this.#engine = engine;
    this.#editor = editor;
    if (!octopus) {
      this.__rootLayerId = crypto.randomUUID();
      this.dimensions = { width: 1920, height: 1080 };
      octopus = createEmptyArtboard(id, this.dimensions, this.__rootLayerId);
    } else {
      const parsed = JSON.parse(octopus);
      this.__rootLayerId = parsed.content.id;
      this.dimensions = parsed.dimensions;
    }
    this.#octopus = octopus;

    const ode = this.#engine.ode;

    this.__component = automaticScope((tmpScope) => {
      const pageRef = createStringRef(ode, tmpScope, "page");
      const idRef = createStringRef(ode, tmpScope, id);
      const octopusRef = createStringRef(ode, tmpScope, this.#octopus);
      const metadata: ComponentMetadata = {
        id: idRef,
        page: pageRef,
        position: [0, 0],
      };
      return ode.design_addComponentFromOctopusString(
        this.#engine.design,
        metadata,
        octopusRef,
        {},
      );
    });
  }

  type = "ARTBOARD" as const;
  offset: { x: number; y: number } = { x: 0, y: 0 };
  dimensions = { width: 0, height: 0 };

  setX(value: number): ArtboardNode {
    todo();
  }
  setY(value: number): ArtboardNode {
    todo();
  }

  unstable_setStaticAnimation(animation: string) {
    automaticScope((scope) => {
      const ref = createStringRef(this.#engine.ode, scope, animation);
      this.#engine.ode.pr1_component_loadAnimation(this.__component, ref, {});
    });
  }

  unstable_readOctopus(): string {
    return this.#octopus;
  }

  // FIXME: this method mutates the data
  _updateLayerIds(
    data?: Octopus["schemas"]["Layer"],
  ): Octopus["schemas"]["Layer"] | undefined {
    if (!data) {
      return;
    }
    // TODO: use ODE API to check for duplication when it's available
    if (this.#layersIds.has(data.id)) {
      data.id = crypto.randomUUID();
      this.#layersIds.add(data.id);
    }

    if ("layers" in data) {
      if (Array.isArray(data.layers)) {
        for (const layer of data.layers) {
          this._updateLayerIds(layer);
        }
      }
    }

    return data;
  }

  async paste(data: OctopusFile): Promise<void> {
    try {
      await this.getRootLayer().paste(data);
      this.#editor?._notify(this, "PASTE_SUCCESS");
    } catch (e) {
      this.#editor?._notify(this, "PASTE_FAILURE", e);
    }
  }

  getRootLayer(): LayerNode {
    // TODO: actually fetch from engine
    return new LayerNodeImpl(
      "GROUP",
      this.__component,
      this.__rootLayerId,
      this.#engine,
    );
  }

  getLayers({ naturalOrder = true }: getLayersOptions = {}) {
    return automaticScope((scope) => {
      const layerList = this.#engine.ode.component_listLayers(
        scope,
        this.__component,
      );
      const layers = new Map<string, LayerListItem>();
      let rootLayer = "";

      for (let i = 0; i < layerList.n; i++) {
        const layer = this.#engine.ode.LayerList_getEntry(layerList, i);
        const id = readStringRef(this.#engine.ode, layer.id);
        const parentId = readStringRef(this.#engine.ode, layer.parentId);
        // save layer id to the Set for later duplication checks
        // TODO: this adds to complexity since it needs to traverse octopus date before sending it to the engine
        this.#layersIds.add(id);
        this.#layersParents.set(id, parentId);

        // check if layer exists (boilerplated parent layer from child) and update it
        // otherwise create a new layer with empty children (layers) array
        let boilerplatedLayer = layers.get(id)!;
        if (!boilerplatedLayer) {
          layers.set(id, {
            id,
            parentId,
            name: readStringRef(this.#engine.ode, layer.name),
            type: layer.type,
            layers: [],
          });
        } else {
          // take only children from boilerplated layer and update other fields
          layers.set(id, {
            id,
            parentId,
            name: readStringRef(this.#engine.ode, layer.name),
            type: layer.type,
            layers: boilerplatedLayer.layers,
          });
        }

        // check if layer has parent, if not then it's a root layer
        if (parentId) {
          // check if parent exists, if not create a boilerplate
          if (!layers.has(parentId)) {
            layers.set(parentId, {
              id: parentId,
              type: "",
              name: "",
              layers: [],
            });
          }
          // get parent and update children array considering reverse flag
          if (layers.has(parentId)) {
            const parent = layers.get(parentId) as LayerListItem;
            if (naturalOrder) {
              parent.layers.unshift(layers.get(id) as LayerListItem);
            } else {
              parent.layers.push(layers.get(id) as LayerListItem);
            }
          }
        } else {
          rootLayer = id;
        }
      }

      if (!rootLayer) {
        throw new Error("No root layer found");
      }

      return layers.get(rootLayer) as LayerListItem;
    });
  }

  identifyLayer(position: readonly [number, number], radius = 1) {
    const layer = this.#engine.ode.component_identifyLayer(
      this.__component,
      position,
      radius,
    );
    if (layer.length === 0) return null;
    return this.#engine.ode.getString(layer);
  }

  getLayerById(id: string): LayerNode | null {
    // TODO: detect if layer does not exist
    // TODO: maybe guarantee referential equality for layer with same id somehow
    return new LayerNodeImpl("GROUP", this.__component, id, this.#engine);
  }
}

function createEmptyArtboard(
  id: string,
  dimensions: { width: number; height: number },
  rootLayerId: string = crypto.randomUUID(),
) {
  return JSON.stringify({
    version: "3.0.0-odf",
    id: id,
    type: "ARTBOARD",
    dimensions: dimensions,
    content: {
      id: rootLayerId,
      type: "GROUP",
      name: "Root",
      visible: true,
      opacity: 1,
      blendMode: "NORMAL",
      transform: [1, 0, 0, 1, 0, 0],
      layers: [],
      effects: [],
    },
  });
}
