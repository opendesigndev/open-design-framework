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
  // FIXME: This is not working with recent builds of the engine (_malloc and _free are not exported)
  // automaticScope((scope) => {
  //   const ptr = engine.ode.raw._malloc(maxBytes);
  //   if (ptr === 0) throw new Error("Failed to allocate memory");
  //   scope(() => engine.ode.raw._free(ptr));
  //   for (const { data, path } of images) {
  //     engine.ode.raw.HEAPU8.set(data.data, ptr);
  //     automaticScope((scope) => {
  //       engine.ode.design_loadImagePixels(
  //         engine.designImageBase,
  //         createStringRef(engine.ode, scope, path),
  //         {
  //           pixels: ptr,
  //           format: engine.ode.PIXEL_FORMAT_RGBA,
  //           height: data.height,
  //           width: data.width,
  //         },
  //       );
  //     });
  //   }
  // });
}

export function loadPastedImages(engine: Engine, data: ImportedClipboardData) {
  return loadImages(
    engine,
    data.files.map((f) => (f.type === "BINARY" ? f : null)).filter(notNull),
  );
}

function notNull<T>(value: T | null): value is T {
  return value !== null;
}
