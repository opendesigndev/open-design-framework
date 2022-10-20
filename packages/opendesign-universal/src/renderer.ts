import { env } from "#env";

import { __internals, todo } from "./internals.js";

export type Renderer = {
  [__internals]: unknown;
  readonly viewport: { x: number; y: number; width: number; height: number };
};

export type RendererInternals = { canvas: any };

export function createRenderer(): Renderer {
  return {
    [__internals]: {
      canvas: env.createCanvas(),
    },
    get viewport() {
      return todo();
    },
  };
}
