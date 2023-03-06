import type { ComponentHandle } from "@opendesign/engine";
import { Scalar_array_6 } from "@opendesign/engine";
import type { Octopus } from "@opendesign/octopus-ts";

import type { Engine } from "../engine/engine.js";
import { loadPastedImages } from "../engine/load-images.js";
import { automaticScope, createStringRef } from "../engine/memory.js";
import type { ImportedClipboardData } from "../paste/import-from-clipboard-data.js";
import type { BaseNode } from "./node.js";
import { BaseNodeImpl } from "./node.js";

export type Rectangle = readonly [
  a: readonly [x: number, y: number],
  b: readonly [x: number, y: number],
];

export type Transformation = readonly [
  a: number, // scale x
  b: number, // shear y
  c: number, // shear x
  d: number, // scale y
  e: number, // translate x
  f: number, // translate y
];

export type LayerMetrics = {
  transformation: Transformation;
  logicalBounds: Rectangle;
  graphicalBounds: Rectangle;
  transformedGraphicalBounds: Rectangle;
};

export interface LayerNode extends BaseNode {
  type: "SHAPE" | "TEXT" | "COMPONENT_REFERENCE" | "GROUP" | "MASK_GROUP";

  id: string;

  /**
   * Adds data which was previously read from clipboard into this layer.
   *
   * @param data
   */
  paste(data: ImportedClipboardData): Promise<void>;

  /**
   * Creates layer from octopus data
   */
  createLayer(octopus: Octopus["schemas"]["Layer"]): LayerNode;

  /**
   * Returns information about layer bounding box
   */
  readMetrics(): LayerMetrics;

  /**
   * Move layer within Component (Artboard) by x axis by given offset
   * @param offset offset in px
   * @see transform
   */
  moveX(offset: number): void;

  /**
   * Move layer within Component (Artboard) by y axis by given offset
   * @param offset offset in px
   * @see transform
   */
  moveY(offset: number): void;

  /**
   * Set layer's position relative to Component (Artboard) by x/y coordinates
   * @param coordinates coordinates in px, an array of two numbers, each number is optional
   */
  setPosition(coordinates: [x?: number, y?: number]): void;

  /**
   * Change layer's size by given width and height
   * @param width width in px
   * @param height height in px
   * @returns true if transformation was applied, false if it was not applied
   */
  setSize(width: number, height: number): boolean;

  /**
   * Change layer's width by given width
   * @param width width in px
   * @returns true if transformation was applied, false if it was not applied
   */
  setWidth(width: number): boolean;

  /**
   * Change layer's height by given height
   * @param height height in px
   * @returns true if transformation was applied, false if it was not applied
   */
  setHeight(height: number): boolean;
}

export class LayerNodeImpl extends BaseNodeImpl implements LayerNode {
  type: LayerNode["type"];
  #component: ComponentHandle;
  id: string;
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
    this.id = id;
    this.#engine = engine;
  }

  async paste(data: ImportedClipboardData): Promise<void> {
    // TODO: the same filtering is in page if no artboard is present. Do we need this?
    const octopus = data.files.find((f) => f.type === "JSON");
    if (!octopus || octopus.type !== "JSON" || !octopus.data.content)
      throw new Error("Pasted data do not contain octopus");
    // TODO: figure out if we can use octopus.source so that parse errors have
    // correct position
    this.createLayer(octopus.data.content);

    await loadPastedImages(this.#engine, data);
    this.#engine.redraw();
  }

  createLayer(octopus: Octopus["schemas"]["Layer"]) {
    automaticScope((scope) => {
      const octopusString = JSON.stringify(octopus);
      this.#engine.ode.component_addLayer(
        this.#component,
        createStringRef(this.#engine.ode, scope, this.id), // parent
        createStringRef(this.#engine.ode, scope, ""), // before, empty means append
        createStringRef(this.#engine.ode, scope, octopusString), // octopus
        {},
      );
    });
    this.#engine.redraw();
    return new LayerNodeImpl(
      octopus.type,
      this.#component,
      octopus.id,
      this.#engine,
    );
  }

  readMetrics(): LayerMetrics {
    return automaticScope((scope) => {
      const id = createStringRef(this.#engine.ode, scope, this.id);
      const res = this.#engine.ode.component_getLayerMetrics(
        this.#component,
        id,
      );
      return {
        ...res,
        transformation: res.transformation.matrix,
      };
    });
  }

  moveX(offset: number): void {
    return automaticScope((scope) => {
      // const parseError = this.#engine.ode.ParseError(scope);
      const currentTransformation = [...this.readMetrics().transformation];
      currentTransformation[4] += offset;
      const id = createStringRef(this.#engine.ode, scope, this.id);
      this.#engine.ode.component_transformLayer(
        this.#component,
        id,
        "PARENT_COMPONENT",
        { matrix: [1, 0, 0, 1, offset, 0] },
      );
      this.#engine.redraw();
    });
  }

  moveY(offset: number): void {
    return automaticScope((scope) => {
      // const parseError = this.#engine.ode.ParseError(scope);
      const currentTransformation = [...this.readMetrics().transformation];
      currentTransformation[5] += offset;
      const id = createStringRef(this.#engine.ode, scope, this.id);
      this.#engine.ode.component_transformLayer(
        this.#component,
        id,
        "PARENT_COMPONENT",
        { matrix: [1, 0, 0, 1, 0, offset] },
      );
      this.#engine.redraw();
    });
  }

  setPosition(coordinates: [x?: number, y?: number]): void {
    return automaticScope((scope) => {
      // const parseError = this.#engine.ode.ParseError(scope);
      const currentTransformation = [...this.readMetrics().transformation];
      const transform = [1, 0, 0, 1, 0, 0] satisfies Scalar_array_6;

      if (coordinates[0] !== undefined)
        transform[4] = coordinates[0] - currentTransformation[4];

      if (coordinates[1] !== undefined)
        transform[5] = coordinates[1] - currentTransformation[5];

      const id = createStringRef(this.#engine.ode, scope, this.id);

      if (coordinates[0] !== undefined || coordinates[1] !== undefined) {
        this.#engine.ode.component_transformLayer(
          this.#component,
          id,
          "PARENT_COMPONENT",
          { matrix: transform },
        );
        this.#engine.redraw();
      }
    });
  }

  setWidth(width: number): boolean {
    return automaticScope((scope) => {
      const parseError = this.#engine.ode.ParseError(scope);
      const metrix = this.readMetrics();
      const widthRatio = width / metrix.graphicalBounds[1][0];
      const transform = [...metrix.transformation];
      // const scaleWidth = width / transform[0];
      transform[0] = widthRatio;
      const id = createStringRef(this.#engine.ode, scope, this.id);
      const transformOctopus = {
        subject: "LAYER",
        op: "PROPERTY_CHANGE",
        values: {
          transform,
        },
      };
      const transformationString = createStringRef(
        this.#engine.ode,
        scope,
        JSON.stringify(transformOctopus),
      );
      this.#engine.ode.component_modifyLayer(
        this.#component,
        id,
        transformationString,
        parseError,
      );
      this.#engine.redraw();
      return true;
    });
  }

  setHeight(height: number): boolean {
    return automaticScope((scope) => {
      const parseError = this.#engine.ode.ParseError(scope);
      const metrix = this.readMetrics();
      const heightRatio = height / metrix.graphicalBounds[1][1];
      const transform = [...metrix.transformation];
      transform[3] = heightRatio;
      const id = createStringRef(this.#engine.ode, scope, this.id);
      const transformOctopus = {
        subject: "LAYER",
        op: "PROPERTY_CHANGE",
        values: {
          transform,
        },
      };
      const transformationString = createStringRef(
        this.#engine.ode,
        scope,
        JSON.stringify(transformOctopus),
      );
      this.#engine.ode.component_modifyLayer(
        this.#component,
        id,
        transformationString,
        parseError,
      );
      this.#engine.redraw();
      return true;
    });
  }

  setSize(width: number, height: number): boolean {
    return automaticScope((scope) => {
      const parseError = this.#engine.ode.ParseError(scope);
      const transform = [...this.readMetrics().transformation];
      transform[0] = width;
      transform[3] = height;
      const id = createStringRef(this.#engine.ode, scope, this.id);
      const transformOctopus = {
        subject: "LAYER",
        op: "PROPERTY_CHANGE",
        values: {
          transform,
        },
      };
      const transformationString = createStringRef(
        this.#engine.ode,
        scope,
        JSON.stringify(transformOctopus),
      );
      this.#engine.ode.component_modifyLayer(
        this.#component,
        id,
        transformationString,
        parseError,
      );
      this.#engine.redraw();
      return true;
    });
  }
}
