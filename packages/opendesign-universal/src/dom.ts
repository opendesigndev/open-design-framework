import type { Editor } from "./editor.js";
import { editorGetEngine } from "./editor.js";
import { editorGetCanvas } from "./editor.js";
import { createPR1Renderer } from "./engine/engine.js";
import { detachedScope } from "./engine/memory.js";
import type { PageNodeImpl } from "./nodes/page.js";

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
  scope(() => void div.removeChild(canvas));
  div.style.boxSizing = "border-box";
  canvas.style.position = "absolute";
  canvas.style.transformOrigin = "top left";
  let frameRequested = false;

  const renderer = createPR1Renderer(
    engine.ode,
    scope,
    engine.rendererContext,
    (editor.currentPage as PageNodeImpl).__artboard?.__component!,
    engine.designImageBase
  );
  onResize();

  // Resize gets fired on zoom, which changes devicePixelRatio
  scopedListen<WindowEventMap>(window)(scope, "resize", onResize);
  // This will get called any other time
  const observer = new ResizeObserver(onResize);
  observer.observe(div);
  scope(observer, disconnect);

  scopedListen(div)(scope, "wheel", onWheel);

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
    engine.frameView.scale *= Math.pow(1.1, -parseScrollDelta(event) / 120);
    requestFrame();
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
    listener: (event: Map[K]) => any
  ): any;
  removeEventListener<K extends keyof Map>(
    k: K,
    listener: (event: Map[K]) => any
  ): any;
}): <Key extends keyof Map>(
  scope: (cleanup: () => void) => void,
  event: Key,
  listener: (event: Map[Key]) => void
) => void {
  return (scope, event, listener) => {
    target.addEventListener(event, listener);
    scope(() => void target.removeEventListener(event, listener));
  };
}
