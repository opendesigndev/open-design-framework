import { parseImage } from "@opendesign/env";

import type { OctopusFile } from "../octopus-file/octopus-file.js";
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
  if (images.length < 1) return;
  automaticScope((scope) => {
    for (const { data, path } of images) {
      automaticScope((scope) => {
        engine.ode.design_loadImagePixels(
          engine.designImageBase,
          createStringRef(engine.ode, scope, path),
          {
            pixels: engine.ode.makeMemoryBuffer(scope, data.data.buffer).data,
            format: engine.ode.PIXEL_FORMAT_RGBA,
            height: data.height,
            width: data.width,
          },
        );
      });
    }
  });
}

export async function loadPastedImages(engine: Engine, data: OctopusFile) {
  const images = data.manifest.components[0].assets?.images;
  if (!images) return;

  return await loadImages(
    engine,
    (
      await Promise.all(
        images.map(async (image) => {
          if (image.location.type === "EXTERNAL") {
            console.warn("External images are not supported yet");
            return null;
          }
          return {
            path: image.location.path,
            data: await data.readBinary(image.location.path),
          };
        }),
      )
    ).filter(notNull),
  );
}

function notNull<T>(value: T | null): value is T {
  return value !== null;
}
