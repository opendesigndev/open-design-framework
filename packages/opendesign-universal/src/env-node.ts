import type { Env } from "#env";

import { todo } from "./internals.js";

export const env: Env = {
  createCanvas: () => todo("createCanvas"),
  fetch: () => todo("fetch"),
  parseImage: () => todo("parseImage"),
};
