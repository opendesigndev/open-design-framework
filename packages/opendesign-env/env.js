export const createCanvas = () => {
  return document.createElement("canvas");
};

export const fetch = globalThis.fetch.bind(globalThis);

/**
 *
 * @param {Uint8Array} data
 * @param {AbortSignal} signal
 * @returns {Promise<{ width: number; height: number; data: ArrayBuffer }>}
 */
export async function parseImage(data, signal) {
  const url = URL.createObjectURL(new Blob([data]));
  try {
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

    const bitmap = await createImageBitmap(image);

    performance.mark("drawImage-start");
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    performance.mark("drawImage-end");
    performance.measure("drawImage", "drawImage-start", "drawImage-end");

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  } finally {
    URL.revokeObjectURL(url);
  }
}
export const warn = console.warn.bind(console);

export const requestAnimationFrame =
  globalThis.requestAnimationFrame.bind(globalThis);

export const cancelAnimationFrame =
  globalThis.cancelAnimationFrame.bind(globalThis);
