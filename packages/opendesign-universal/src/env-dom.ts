import type { Env } from "#env";

import { automaticScopeAsync } from "./engine/memory.js";

export const env: Env = {
  createCanvas: () => {
    return document.createElement("canvas");
  },
  fetch: fetch.bind(globalThis),
  parseImage: (data, signal) =>
    automaticScopeAsync(async (scope) => {
      const url = scope(
        URL.createObjectURL(new Blob([data])),
        URL.revokeObjectURL
      );
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.addEventListener("load", resolve);
        image.addEventListener("error", (event) => {
          console.log(event);
          reject(new Error("Failed to load image"));
        });
        image.src = url;
      });
      signal?.throwIfAborted();

      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(image, 0, 0);

      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }),
};
