import type { ComponentHandle } from "@opendesign/engine";
import type { Octopus } from "@opendesign/octopus-fig/lib/src/typings/octopus.js";

import type { Engine } from "../engine/engine.js";
import { throwOnParseError } from "../engine/engine.js";
import { createParseError } from "../engine/engine.js";
import { loadPastedImages } from "../engine/load-images.js";
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

    await loadPastedImages(this.#engine, data);
    this.#engine.redraw();
  }

  createLayer(octopus: Octopus["Layer"]) {
    automaticScope((scope) => {
      const parseError = createParseError(this.#engine.ode, scope);
      const octopusString = JSON.stringify(octopus);
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
