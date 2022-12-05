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
  offset: { x: number; y: number };

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
}

export class ArtboardNodeImpl extends BaseNodeImpl implements ArtboardNode {
  #engine: Engine;
  // TODO: cleanup
  #scope = detachedScope();
  // TODO: make private
  __component: ComponentHandle;
  constructor(engine: Engine, id: string = generateUUID(), octopus?: string) {
    super();
    this.#engine = engine;
    this.__component = createComponentFromOctopus(
      engine.ode,
      this.#scope.scope,
      this.#engine.design,
      "page",
      id ?? "OCTOPUS1",
      octopus ??
        `{"version":"3.0.0-alpha.33","id":${JSON.stringify(
          id
        )},"type":"ARTBOARD","dimensions":{"width":640,"height":480},"content":{"id":"ROOT1","type":"GROUP","name":"Root","visible":true,"opacity":1,"blendMode":"NORMAL","transform":[1,0,0,1,0,0],"layers":[{"id":"SHAPE1","type":"SHAPE","name":"Shape 1","visible":true,"opacity":1,"blendMode":"NORMAL","transform":[1,0,0,1,0,0],"shape":{"path":{"type":"PATH","geometry":"M 193.287149 3.393170 L 476.025269 9.660451 L 482.682699 213.904965 L 192.292978 221.465743 Z","transform":[1,0,0,1,-100,100],"visible":true},"fills":[{"type":"COLOR","visible":true,"blendMode":"NORMAL","color":{"r":1,"g":0.5,"b":0,"a":1}}],"strokes":[{"fill":{"type":"COLOR","visible":true,"blendMode":"NORMAL","color":{"r":0.25,"g":0.25,"b":0.25,"a":1}},"thickness":6,"position":"OUTSIDE","visible":true,"style":"SOLID"}]},"effects":[{"type":"DROP_SHADOW","basis":"BODY","visible":true,"blendMode":"NORMAL","shadow":{"offset":{"x":20,"y":40},"blur":0,"choke":0,"color":{"r":0,"g":0,"b":0,"a":0.5}}}]},{"id":"SHAPE2","type":"SHAPE","name":"Shape 2","visible":true,"opacity":1,"blendMode":"NORMAL","transform":[1,0,0,1,0,0],"shape":{"path":{"type":"PATH","geometry":"M 283.078463 53.153966 L 563.101657 46.649861 L 568.693136 251.248390 L 277.516282 252.142949 Z","transform":[1,0,0,1,0,0],"visible":true},"fills":[{"type":"COLOR","visible":true,"blendMode":"NORMAL","color":{"r":0,"g":0.5,"b":1,"a":1}}],"strokes":[{"fill":{"type":"COLOR","visible":true,"blendMode":"NORMAL","color":{"r":0.25,"g":0.25,"b":0.25,"a":1}},"thickness":6,"position":"CENTER","visible":true,"style":"SOLID"}]},"effects":[{"type":"BLUR","basis":"LAYER_AND_EFFECTS","blur":4}]}],"effects":[]}}`
    );
  }

  type = "ARTBOARD" as const;
  offset: { x: number; y: number } = { x: 0, y: 0 };
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
}
