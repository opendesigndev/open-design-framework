import type { ComponentHandle } from "@opendesign/engine";
import { Scalar_array_6 } from "@opendesign/engine";
import type { Octopus } from "@opendesign/octopus-ts";

import type { Engine } from "../engine/engine.js";
import { loadPastedImages } from "../engine/load-images.js";
import { automaticScope, createStringRef } from "../engine/memory.js";
import type { ImportedClipboardData } from "../paste/import-from-clipboard-data.js";
import { isDefinedNumber } from "../utils.js";
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

export type LayerChangeType = "SCALE" | "ROTATE" | "TRANSLATE" | "TRANSFORM";

export type LayerEvents = {
  changed: LayerChangeType;
  removed: void;
};

export interface LayerNode extends BaseNode {
  type: "SHAPE" | "TEXT" | "COMPONENT_REFERENCE" | "GROUP" | "MASK_GROUP";

  id: string;

  /**
   * Similar to addEventListener but returns function which removes the event
   * listener.
   *
   * @param event
   * @param listener
   */
  listen<T extends keyof LayerEvents>(
    event: T,
    listener: (event: LayerEvents[T]) => void,
  ): () => void;

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
  setSize(width?: number, height?: number): boolean;

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

  /**
   * Scale layer by given x and y factors and optional origin
   * @param xFactor x factor
   * @param yFactor y factor
   * @param origin origin in px, an array of two numbers, each number is optional
   * @returns true if transformation was applied, false if it was not applied
   */
  scale(
    xFactor: number,
    yFactor: number,
    origin?: [x?: number, y?: number],
  ): boolean;
}

export class LayerNodeImpl extends BaseNodeImpl implements LayerNode {
  type: LayerNode["type"];
  #component: ComponentHandle;
  id: string;
  #engine: Engine;
  #events = new Map<keyof LayerEvents, Set<(event: any) => void>>();

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
      const metrix = this.readMetrics();
      const currentTransformation = [
        ...this.readMetrics().transformation,
      ] satisfies Scalar_array_6;
      const currentX = currentTransformation[4];
      const layerWidth =
        metrix.transformedGraphicalBounds[1][0] -
        metrix.transformedGraphicalBounds[0][0];
      const widthRatio = width / layerWidth;
      const shiftedX = currentX * widthRatio;
      const differenceX = currentX - shiftedX;
      const transform = currentTransformation;
      transform[0] = widthRatio;
      transform[4] = differenceX;
      transform[5] = 0;
      const id = createStringRef(this.#engine.ode, scope, this.id);
      this.#engine.ode.component_transformLayer(
        this.#component,
        id,
        "PARENT_COMPONENT",
        {
          matrix: transform,
        },
      );
      this.#engine.redraw();
      return true;
    });
  }

  setHeight(height: number): boolean {
    return automaticScope((scope) => {
      const metrix = this.readMetrics();
      const currentTransformation = [
        ...metrix.transformation,
      ] satisfies Scalar_array_6;
      const currentY = currentTransformation[5];
      const layerHeight =
        metrix.transformedGraphicalBounds[1][1] -
        metrix.transformedGraphicalBounds[0][1];
      const heightRatio = height / layerHeight;
      const shiftedY = currentY * heightRatio;
      const differenceY = currentY - shiftedY;
      const transform = currentTransformation;
      transform[3] = heightRatio;
      transform[4] = 0;
      transform[5] = differenceY;
      const id = createStringRef(this.#engine.ode, scope, this.id);
      this.#engine.ode.component_transformLayer(
        this.#component,
        id,
        "PARENT_COMPONENT",
        {
          matrix: transform,
        },
      );
      this.#engine.redraw();
      return true;
    });
  }

  setSize(width?: number, height?: number): boolean {
    return automaticScope((scope) => {
      const metrix = this.readMetrics();
      const currentTransformation = [
        ...metrix.transformation,
      ] satisfies Scalar_array_6;
      const currentX = currentTransformation[4];
      const currentY = currentTransformation[5];
      const layerWidth =
        metrix.transformedGraphicalBounds[1][0] -
        metrix.transformedGraphicalBounds[0][0];
      const layerHeight =
        metrix.transformedGraphicalBounds[1][1] -
        metrix.transformedGraphicalBounds[0][1];
      const widthRatio = isDefinedNumber(width) ? width / layerWidth : 1;
      const heightRatio = isDefinedNumber(height) ? height / layerHeight : 1;
      const shiftedX = currentX * widthRatio;
      const shiftedY = currentY * heightRatio;
      const differenceX = currentX - shiftedX;
      const differenceY = currentY - shiftedY;
      const transform = currentTransformation;
      transform[0] = widthRatio;
      transform[3] = heightRatio;
      transform[4] = differenceX;
      transform[5] = differenceY;
      const id = createStringRef(this.#engine.ode, scope, this.id);
      this.#engine.ode.component_transformLayer(
        this.#component,
        id,
        "PARENT_COMPONENT",
        {
          matrix: transform,
        },
      );
      this.#engine.redraw();
      this.#dispatch("changed", "SCALE");
      return true;
    });
  }

  scale(xFactor: number, yFactor: number, origin?: [x?: number, y?: number]) {
    return automaticScope((scope) => {
      const metrix = this.readMetrics();
      const [a, b, c, d, e, f] = [...metrix.transformation];
      const x = origin?.[0] ? origin[0] : metrix.transformation[4];
      const y = origin?.[1] ? origin[1] : metrix.transformation[5];
      const tx = x * (1 - xFactor);
      const ty = y * (1 - yFactor);

      const transform = [
        a * xFactor,
        b * yFactor,
        c * xFactor,
        d * yFactor,
        e + tx,
        f + ty,
      ] satisfies Scalar_array_6;
      const id = createStringRef(this.#engine.ode, scope, this.id);

      this.#engine.ode.component_transformLayer(
        this.#component,
        id,
        "PARENT_COMPONENT",
        {
          matrix: transform,
        },
      );
      this.#engine.redraw();
      this.#dispatch("changed", "SCALE");
      return true;
    });
  }

  #dispatch<T extends keyof LayerEvents>(type: T, data: LayerEvents[T]) {
    const listeners = this.#events.get(type);
    if (listeners) {
      for (const listener of listeners.values()) {
        listener(data);
      }
    }
  }

  listen<T extends keyof LayerEvents>(
    type: T,
    listener: (event: LayerEvents[T]) => void,
  ): () => void {
    // create a copy so that you can use same listener twice. IDK why you would
    // want it, but :shrug:
    const cb = (data: any) => void listener(data);
    let set = this.#events.get(type);
    if (!set) {
      set = new Set();
      this.#events.set(type, set);
    }
    set.add(cb);
    return () => {
      // typescript can't analyze this properly but if you read previous lines
      // you can see that this cant be undefined
      set!.delete(cb);
    };
  }
}
