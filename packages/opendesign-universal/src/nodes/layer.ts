import type { ComponentHandle } from "@opendesign/engine";
import type { Octopus } from "@opendesign/octopus-fig/lib/src/typings/octopus.js";

import type { Engine } from "../engine/engine.js";
import { throwOnParseError } from "../engine/engine.js";
import { createParseError } from "../engine/engine.js";
import { loadImages } from "../engine/load-images.js";
import { automaticScope, createStringRef } from "../engine/memory.js";
import type { ImportedClipboardData } from "../paste/import-from-clipboard-data.js";
import type { BaseNode } from "./node.js";
import { BaseNodeImpl } from "./node.js";

export interface LayerNode extends BaseNode {
  type: "SHAPE" | "TEXT" | "COMPONENT_REFERENCE" | "GROUP" | "MASK_GROUP";

  /**
   * Adds data which was previously read from clipboard into this layer.
   *
   * @param data
   */
  paste(data: ImportedClipboardData): Promise<void>;

  /**
   * Creates layer from octopus data
   */
  createLayer(octopus: Octopus["Layer"]): LayerNode;
}

export class LayerNodeImpl extends BaseNodeImpl {
  type: LayerNode["type"];
  #component: ComponentHandle;
  #id: string;
  #engine: Engine;

  constructor(
    type: LayerNode["type"],
    component: ComponentHandle,
    id: string,
    engine: Engine,
  ) {
    super();
    this.type = type;
    this.#component = component;
    this.#id = id;
    this.#engine = engine;
  }

  async paste(data: ImportedClipboardData): Promise<void> {
    const octopus = JSON.parse(data._components.values().next().value);
    this.createLayer(octopus.content);

    await loadImages(
      this.#engine,
      Array.from(data._images.entries(), ([path, data]) => ({ path, data })),
    );
    this.#engine.redraw();
  }

  createLayer(octopus: Octopus["Layer"]) {
    automaticScope((scope) => {
      const parseError = createParseError(this.#engine.ode, scope);
      const octopusString = JSON.stringify(cleanupOctopus(octopus));
      const res = this.#engine.ode.component_addLayer(
        this.#component,
        createStringRef(this.#engine.ode, scope, this.#id), // parent
        createStringRef(this.#engine.ode, scope, ""), // before, empty means append
        createStringRef(this.#engine.ode, scope, octopusString), // octopus
        parseError,
      );
      throwOnParseError(this.#engine.ode, res, parseError, octopusString);
    });
    this.#engine.redraw();
    return new LayerNodeImpl(
      octopus.type,
      this.#component,
      octopus.id,
      this.#engine,
    );
  }
}

function cleanupOctopus<T>(json: T): T {
  if (Array.isArray(json)) {
    let changed = false;
    let cleaned: any = json.map((l) => {
      const res = cleanupOctopus(l);
      if (l !== res) changed = true;
      return res;
    });
    if (!changed) return json;
    return cleaned;
  }
  if (json && typeof json === "object") {
    let changed = false;
    const obj = Object.fromEntries(
      Object.entries(json).map(([k, v]) => {
        const inner = cleanupOctopus(v);
        if (k === "meta") {
          changed = true;
          return [k, undefined];
        }
        if (inner !== v) changed = true;
        return [k, inner];
      }),
    );
    if (changed) return obj as any;
    return json;
  }
  return json;
}
