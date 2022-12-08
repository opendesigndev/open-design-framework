import type { ImportedClipboardData } from "../index.js";
import { importFromClipboardData } from "../index.js";
import type { Editor } from "./editor.js";
import { editorGetEngine } from "./editor.js";
import { editorGetCanvas } from "./editor.js";
import { createPR1Renderer } from "./engine/engine.js";
import { detachedScope } from "./engine/memory.js";
import type { PageNodeImpl } from "./nodes/page.js";
import { MemoryExporter } from "./paste/memory-exporter.js";

/**
 * Attaches editor into provided div. Only available in DOM environments.
 *
 * ## Example:
 *
 * ```ts
 * import { createEditor } from '@opendesign/universal'
 * import { mount } from '@opendesign/universal/dom'
 *
 * const editor = createEditor(/* ... *\/)
 * const cleanup = mount(editor, document.querySelector("div#canvas"))
 * // ... eventually
 * cleanup()
 * ```
 *
 * @param editor
 * @param div
 * @returns
 */
export function mount(editor: Editor, div: HTMLDivElement): () => void {
  const canvas: HTMLCanvasElement = editorGetCanvas(editor);
  const engine = editorGetEngine(editor);

  const { scope, destroy } = detachedScope();
  div.appendChild(canvas);
  scope(() => void canvas.parentElement?.removeChild(canvas));
  div.style.boxSizing = "border-box";
  canvas.style.position = "absolute";
  canvas.style.transformOrigin = "top left";
  let frameRequested = false;
  let offset: [number, number] = [0, 0];

  const renderer = createPR1Renderer(
    engine.ode,
    scope,
    engine.rendererContext,
    (editor.currentPage as PageNodeImpl).__artboard?.__component!,
    engine.designImageBase,
  );
  engine.renderers.add(renderer);
  scope(() => {
    engine.renderers.delete(renderer);
  });
  onResize();

  // Resize gets fired on zoom, which changes devicePixelRatio
  scopedListen<WindowEventMap>(window)(scope, "resize", onResize);
  // This will get called any other time
  const observer = new ResizeObserver(onResize);
  observer.observe(div);
  scope(observer, disconnect);

  scopedListen(div)(scope, "wheel", onWheel);
  scopedListen(div)(scope, "click", (event) => {
    console.log(parsePosition(event));
  });

  return destroy;

  function draw() {
    frameRequested = false;
    // TODO: maybe debounce, or memoize
    engine.ode.pr1_animation_drawFrame(renderer, engine.frameView, 0);
  }

  function requestFrame() {
    if (frameRequested) return;
    requestAnimationFrame(draw);
    frameRequested = true;
  }

  function onWheel(event: WheelEvent) {
    event.preventDefault();
    const scrollDelta = parseScrollDelta(event);
    if (event.ctrlKey) {
      const prevScale = engine.frameView.scale;
      const change = Math.pow(1.1, -scrollDelta / 96);
      const scale = prevScale * change;
      let [x, y] = parsePosition(event);

      offset = [
        x - (1 / change) * (x - offset[0]),
        y - (1 / change) * (y - offset[1]),
      ];
      engine.frameView.offset = offset as any;
      engine.frameView.scale = scale;
      requestFrame();
    } else if (event.shiftKey) {
      offset[0] += scrollDelta / engine.frameView.scale;
      engine.frameView.offset = offset as any;
      requestFrame();
    } else {
      offset[1] += scrollDelta / engine.frameView.scale;
      engine.frameView.offset = offset as any;
      requestFrame();
    }
  }

  function onResize() {
    const rect = div.getBoundingClientRect();
    const newWidth = rect.width * window.devicePixelRatio;
    const newHeight = rect.height * window.devicePixelRatio;
    if (canvas.width === newWidth && canvas.height === newHeight) {
      return;
    }
    canvas.width = newWidth;
    canvas.height = newHeight;
    canvas.style.transform = `scale(${1 / window.devicePixelRatio})`;

    engine.frameView.width = canvas.width;
    engine.frameView.height = canvas.height;
    requestFrame();
  }

  function parsePosition(event: WheelEvent | MouseEvent) {
    const scale = engine.frameView.scale;
    return [
      ((event.clientX - div.clientLeft) * window.devicePixelRatio) / scale +
        offset[0],
      ((event.clientY - div.clientTop) * window.devicePixelRatio) / scale +
        offset[1],
    ] as const;
  }
}

function disconnect(observer: ResizeObserver) {
  observer.disconnect();
}

let getScrollLineHeight = () => {
  const el = document.createElement("div");
  el.style.fontSize = "initial";
  el.style.display = "none";
  document.body.appendChild(el);
  const fontSize = window.getComputedStyle(el).fontSize;
  document.body.removeChild(el);
  const value = fontSize ? window.parseInt(fontSize) : undefined;
  getScrollLineHeight = () => value;
  return value;
};

function parseScrollDelta(event: WheelEvent) {
  return event.deltaMode === 0
    ? event.deltaY
    : event.deltaY * (getScrollLineHeight() || 16);
}

/**
 * type-safe add/remove event listener integration with scope abstraction.
 *
 * ```ts
 * // example:
 * scopedListen(div)(scope, "wheel", onWheel);
 * // which is equivalent to
 * div.addEventListener("wheel", onWheel)
 * scope(() => void div.removeEventListener("wheel", onWheel))
 *
 * // if target is not HTMLElement then you have to specify EventMap
 * scopedListen<WindowEventMap>(window)(scope, "resize", (event) => { /*...*\/ });
 * ```
 */
function scopedListen<Map = HTMLElementEventMap>(target: {
  addEventListener<K extends keyof Map>(
    k: K,
    listener: (event: Map[K]) => any,
  ): any;
  removeEventListener<K extends keyof Map>(
    k: K,
    listener: (event: Map[K]) => any,
  ): any;
}): <Key extends keyof Map>(
  scope: (cleanup: () => void) => void,
  event: Key,
  listener: (event: Map[Key]) => void,
) => void {
  return (scope, event, listener) => {
    target.addEventListener(event, listener);
    scope(() => void target.removeEventListener(event, listener));
  };
}

/**
 * Reads data from clipboard paste event and converts them to partial octopus file.
 * Do not rely on structure of returned data, but import it into Editor instead.
 *
 * @returns opaque object which can be imported into editor or null if import failed
 */
export function importFromClipboard(
  input?: ClipboardEvent | string,
): Promise<ImportedClipboardData | null> {
  // NOTE: do not convert this to async function due to differences in user activation criteria
  const dataMaybePromise =
    typeof input === "string"
      ? input
      : input
      ? input.clipboardData?.getData("text/plain")
      : navigator.clipboard.readText();

  return Promise.resolve(dataMaybePromise).then(importFromClipboardData);
}
