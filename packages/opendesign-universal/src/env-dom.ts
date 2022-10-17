import type { Env } from "#env";

export const env: Env = {
  createCanvas: () => {
    return document.createElement("canvas");
  },
  fetch,
};
