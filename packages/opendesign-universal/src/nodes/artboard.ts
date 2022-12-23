import type { ComponentHandle } from "@opendesign/engine";

import type { Engine } from "../engine/engine.js";
import { createComponentFromOctopus } from "../engine/engine.js";
import {
  automaticScope,
  createStringRef,
  detachedScope,
} from "../engine/memory.js";
import { generateUUID, todo } from "../internals.js";
import type { BaseNode } from "./node.js";
import { BaseNodeImpl } from "./node.js";

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
      octopus = JSON.stringify({
        version: "3.0.0-odf",
        id: id,
        type: "ARTBOARD",
        dimensions: this.dimensions,
        content: {
          id: this.__rootLayerId,
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
      this.#engine.ode.pr1_component_loadAnimation(this.__component, ref);
    });
  }

  unstable_readOctopus(): string {
    return this.#octopus;
  }
}
