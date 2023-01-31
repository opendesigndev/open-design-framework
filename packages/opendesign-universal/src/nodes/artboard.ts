import type { ComponentHandle } from "@opendesign/engine";

import type { Engine } from "../engine/engine.js";
import { createLayerList } from "../engine/engine.js";
import { decodeLayerType } from "../engine/engine.js";
import {
  createComponentFromOctopus,
  createParseError,
  throwOnError,
  throwOnParseError,
} from "../engine/engine.js";
import {
  automaticScope,
  createObject,
  createStringRef,
  detachedScope,
} from "../engine/memory.js";
import { generateUUID, todo } from "../internals.js";
import type { ImportedClipboardData } from "../paste/import-from-clipboard-data.js";
import type { LayerNode } from "./layer.js";
import { LayerNodeImpl } from "./layer.js";
import type { BaseNode } from "./node.js";
import { BaseNodeImpl } from "./node.js";

export type LayerListItem = {
  id: string;
  name: string;
  type: LayerNode["type"];
  layers: LayerListItem[];
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
  paste(data: ImportedClipboardData): Promise<void>;

  /**
   * Returns node representing root layer of this artboard.
   */
  getRootLayer(): LayerNode;

  /**
   * Returns list of all layers in this artboard.
   *
   * @param reverse if true, returns layers in reverse order (from top to bottom), default is false
   */
  getListOfLayers(reverse?: boolean): LayerListItem;
}

export class ArtboardNodeImpl extends BaseNodeImpl implements ArtboardNode {
  #engine: Engine;
  // TODO: cleanup
  #scope = detachedScope();
  // TODO: make private
  __component: ComponentHandle;
  // TODO: make private
  __rootLayerId: string;
  #octopus: string;

  constructor(engine: Engine, id: string = generateUUID(), octopus?: string) {
    super();
    this.#engine = engine;
    if (!octopus) {
      this.__rootLayerId = generateUUID();
      this.dimensions = { width: 1920, height: 1080 };
      octopus = createEmptyArtboard(id, this.dimensions, this.__rootLayerId);
    } else {
      const parsed = JSON.parse(octopus);
      this.__rootLayerId = parsed.content.id;
      this.dimensions = parsed.dimensions;
    }
    this.#octopus = octopus;
    this.__component = createComponentFromOctopus(
      engine.ode,
      this.#scope.scope,
      this.#engine.design,
      "page",
      id,
      octopus,
    );
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
      const parseError = createParseError(this.#engine.ode, scope);
      const res = this.#engine.ode.pr1_component_loadAnimation(
        this.__component,
        ref,
        parseError,
      );
      throwOnParseError(this.#engine.ode, res, parseError, animation);
    });
  }

  unstable_readOctopus(): string {
    return this.#octopus;
  }

  paste(data: ImportedClipboardData): Promise<void> {
    return this.getRootLayer().paste(data);
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

  getListOfLayers(reverse = false) {
    return automaticScope((scope) => {
      const layerList = createLayerList(this.#engine.ode, scope);
      const result = this.#engine.ode.component_listLayers(
        this.__component,
        layerList,
      );
      scope(() => void this.#engine.ode.destroyLayerList(layerList));
      throwOnError(this.#engine.ode, result);
      const layers = new Map();
      let rootLayer;

      for (let i = 0; i < layerList.n; i++) {
        // TODO: figure out how to clean memory
        const layer = layerList.getEntry(i);
        const id = layer.id.string();
        const parentId = layer.parentId.string();
        const layerType = decodeLayerType(this.#engine.ode, layer.type);
        // check if layer exists (boilerplated from child) and update it
        // otherwise create a new layer with empty children array
        if (layers.has(id)) {
          const existingLayer = layers.get(id);
          existingLayer.parentId = parentId;
          existingLayer.name = layer.name.string();
          existingLayer.type = layerType;
          layers.set(id, existingLayer);
        } else {
          layers.set(id, {
            id,
            name: layer.name.string(),
            type: layerType,
            layers: [],
          });
        }

        // check if layer has parent, if not then it's a root layer
        if (parentId) {
          // check if parent exists, if not create a boilerplate
          if (!layers.has(parentId)) {
            layers.set(parentId, { id: parentId, layers: [] });
          }
          // get parent and update children array considering reverse flag
          const parent = layers.get(parentId);
          if (reverse) {
            parent.layers.unshift(layers.get(id));
          } else {
            parent.layers.push(layers.get(id));
          }
        } else {
          rootLayer = id;
        }
      }

      return layers.get(rootLayer);
    });
  }
}

function createEmptyArtboard(
  id: string,
  dimensions: { width: number; height: number },
  rootLayerId: string = generateUUID(),
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
