import type { ComponentHandle } from "@opendesign/engine";
import { Scalar_array_6 } from "@opendesign/engine";
import type { Octopus } from "@opendesign/octopus-ts";
import { mat2d } from "gl-matrix";

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

export type OriginValues = "top" | "left" | "right" | "bottom" | "center";

export type Origin = OriginValues | readonly [OriginValues, OriginValues];

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
   * Change layer's size to given width and height
   * @param width width in px
   * @param height height in px
   * @param origin origin represented by string (center) or an array of two strings (sides)
   * @returns true if transformation was applied, false if it was not applied
   */
  setSize(width?: number, height?: number, origin?: Origin): boolean;

  /**
   * Rotate layer by given angle
   * @param angle angle in radians
   * @param origin origin represented by string (center) or an array of two strings (sides), default is center
   * @returns true if transformation was applied, false if it was not applied
   */
  rotate(angle: number, origin?: Origin): boolean;
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

  setSize(width?: number, height?: number, origin?: Origin): boolean {
    return automaticScope((scope) => {
      const calculatedOrigin = this.#calculateOrigin(origin);
      const metrics = this.readMetrics();
      const transformMatrix = mat2d.create();
      const layerWidth =
        metrics.transformedGraphicalBounds[1][0] -
        metrics.transformedGraphicalBounds[0][0];
      const layerHeight =
        metrics.transformedGraphicalBounds[1][1] -
        metrics.transformedGraphicalBounds[0][1];
      const widthRatio = isDefinedNumber(width) ? width / layerWidth : 1;
      const heightRatio = isDefinedNumber(height) ? height / layerHeight : 1;
      const shiftedX = calculatedOrigin[0] * widthRatio;
      const shiftedY = calculatedOrigin[1] * heightRatio;
      const differenceX = calculatedOrigin[0] - shiftedX;
      const differenceY = calculatedOrigin[1] - shiftedY;

      const originTranslationMatrix = mat2d.fromTranslation(mat2d.create(), [
        1 - widthRatio,
        1 - heightRatio,
      ]);
      mat2d.multiply(transformMatrix, originTranslationMatrix, transformMatrix);

      const scalingMatrix = mat2d.fromScaling(mat2d.create(), [
        widthRatio,
        heightRatio,
      ]);
      mat2d.multiply(transformMatrix, scalingMatrix, transformMatrix);

      // Translate the object back to its original position
      const inverseOriginTranslationMatrix = mat2d.invert(
        mat2d.create(),
        originTranslationMatrix,
      );
      mat2d.multiply(
        transformMatrix,
        inverseOriginTranslationMatrix,
        transformMatrix,
      );

      const updatedTransformation = [
        transformMatrix[0],
        transformMatrix[1],
        transformMatrix[2],
        transformMatrix[3],
        differenceX,
        differenceY,
      ] satisfies Scalar_array_6;

      const id = createStringRef(this.#engine.ode, scope, this.id);
      this.#engine.ode.component_transformLayer(
        this.#component,
        id,
        "PARENT_COMPONENT",
        {
          matrix: updatedTransformation,
        },
      );
      this.#engine.redraw();
      return true;
    });
  }

  rotate(angle: number): boolean {
    return automaticScope((scope) => {
      // const calculatedOrigin = this.#calculateOrigin("center");
      const metrics = this.readMetrics();
      const originX = metrics.logicalBounds[1][0] / 2;
      const originY = metrics.logicalBounds[1][1] / 2;
      const mA = mat2d.create();
      // mat2d.fromTranslation(mA, [-calculatedOrigin[0], -calculatedOrigin[1]]);

      const mB = mat2d.fromTranslation(mat2d.create(), [-originX, -originY]);

      const mC = mat2d.fromTranslation(mat2d.create(), [originX, originY]);

      mat2d.multiply(mA, mC, mA);
      mat2d.rotate(mA, mA, angle);
      mat2d.multiply(mA, mB, mA);

      const transformationMatrix = [
        mA[0],
        mA[1],
        mA[2],
        mA[3],
        mA[4],
        mA[5],
      ] satisfies Scalar_array_6;

      const id = createStringRef(this.#engine.ode, scope, this.id);
      this.#engine.ode.component_transformLayer(this.#component, id, "LAYER", {
        matrix: transformationMatrix,
      });
      this.#engine.redraw();

      return true;
    });
  }

  #calculateOrigin(origin?: Origin): [number, number] {
    const metrix = this.readMetrics();
    const [, , , , e, f] = [...metrix.transformation];
    // Default origin is top left
    let result: [number, number] = [e, f];

    if (!origin) {
      return result;
    }

    const layerWidth =
      metrix.transformedGraphicalBounds[1][0] -
      metrix.transformedGraphicalBounds[0][0];
    const layerHeight =
      metrix.transformedGraphicalBounds[1][1] -
      metrix.transformedGraphicalBounds[0][1];

    if (Array.isArray(origin)) {
      const [x, y] = origin;

      if (x === "left") {
        result[0] = e;
      } else if (x === "center") {
        result[0] = e + layerWidth / 2;
      } else if (x === "right") {
        result[0] = e + layerWidth;
      }

      if (y === "top") {
        result[1] = f;
      } else if (y === "center") {
        result[1] = f + layerHeight / 2;
      } else if (y === "bottom") {
        result[1] = f + layerHeight;
      }
    }
    if (typeof origin === "string" && origin === "center") {
      result = [e + layerWidth / 2, f + layerHeight / 2];
    }

    return result;
  }
}
