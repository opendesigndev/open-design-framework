import type { BitmapRef } from "@opendesign/engine";
import { parseImage } from "@opendesign/env";

import type { ImportedClipboardData } from "../paste/import-from-clipboard-data.js";
import type { Engine } from "./engine.js";
import { automaticScope, createStringRef } from "./memory.js";

export async function loadImages(
  engine: Engine,
  imageList: readonly { path: string; data: Uint8Array }[],
) {
  const images = await Promise.all(
    imageList.map(async (image) => {
      return { data: await parseImage(image.data), path: image.path };
    }) || [],
  );
  const maxBytes = images.reduce(
    (prev, image) => prev + image.data.data.byteLength,
    0,
  );
  automaticScope((scope) => {
    const ptr = scope(engine.ode._malloc(maxBytes), engine.ode._free);
    for (const { data, path } of images) {
      engine.ode.HEAP8.set(data.data, ptr);
      automaticScope((scope) => {
        engine.ode.designLoadImagePixels(
          engine.designImageBase,
          createStringRef(engine.ode, scope, path),
          {
            pixels: ptr,
            format: engine.ode.PIXEL_FORMAT_RGBA,
            height: data.height,
            width: data.width,
          },
        );
      });
    }
  });
}

export function loadPastedImages(engine: Engine, data: ImportedClipboardData) {
  return loadImages(
    engine,
    Array.from(data._images.entries(), ([path, data]) => ({ path, data })),
  );
}
