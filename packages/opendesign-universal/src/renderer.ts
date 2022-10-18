import { env } from "#env";

import { __internals } from "./internals.js";

export type Renderer = { [__internals]: unknown };

export type RendererInternals = { canvas: any };

export function createRenderer(): Renderer {
  return {
    [__internals]: {
      canvas: env.createCanvas(),
    },
  };
}
