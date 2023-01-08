import type { ImportedClipboardData } from "../index.js";
import { importFromClipboardData } from "../index.js";
import type { Editor } from "./editor.js";
import { editorGetEngine } from "./editor.js";
import { editorGetCanvas } from "./editor.js";
import type { Renderer } from "./engine/engine.js";
import { createPR1FrameView, createPR1Renderer } from "./engine/engine.js";
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

  const { scope, signal, destroy } = detachedScope();
  div.appendChild(canvas);
  scope(() => void canvas.parentElement?.removeChild(canvas));
  div.style.boxSizing = "border-box";
  canvas.style.position = "absolute";
  canvas.style.transformOrigin = "top left";
  let frameRequested = false;
  let offset: [number, number] = [0, 0];
  let scale = 1;

  const rendererHandle = createPR1Renderer(
    engine.ode,
    scope,
    engine.rendererContext,
    (editor.currentPage as PageNodeImpl).__artboard?.__component!,
    engine.designImageBase,
  );

  const frameView = createPR1FrameView(engine.ode, scope);
  frameView.width = canvas.width;
  frameView.height = canvas.height;
  frameView.scale = 0; // NOTE: this forces first draw
  const renderer: Renderer = {
    handle: rendererHandle,
    frameView,
    time: 0,
  };
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

  scopedListen(div)(scope, "wheel", onWheel, { passive: false });
  scopedListen(div)(scope, "click", (event) => {
    console.log(parsePosition(event));
  });

  let space = 0;
  window.addEventListener(
    "keydown",
    (event) => {
      if (event.key === " ") space = performance.now();
    },
    { signal },
  );
  window.addEventListener(
    "keyup",
    (event) => {
      if (event.key === " ") space = 0;
      if (event.key === "0") {
        offset = [0, 0];
        scale = 1;
        requestFrame();
      }
    },
    { signal },
  );

  div.addEventListener(
    "pointermove",
    (event: PointerEvent) => {
      if (event.buttons === 4 || performance.now() - space < 1000)
        div.setPointerCapture(event.pointerId);
      if (!div.hasPointerCapture(event.pointerId)) return;
      offset[0] -= event.movementX / scale;
      offset[1] -= event.movementY / scale;
      requestFrame();
    },
    { signal },
  );
  div.addEventListener(
    "pointerup",
    (event) => void div.releasePointerCapture(event.pointerId),
    { signal },
  );

  return destroy;

  function draw() {
    frameRequested = false;
    if (
      offset[0] === (renderer.frameView.offset as any)[0] &&
      offset[1] === (renderer.frameView.offset as any)[1] &&
      renderer.frameView.scale === scale
    ) {
      return;
    }

    renderer.frameView.offset = offset as any;
    renderer.frameView.scale = scale;
    engine.ode.pr1_animation_drawFrame(rendererHandle, renderer.frameView, 0);
  }

  function requestFrame() {
    if (frameRequested) return;
    requestAnimationFrame(draw);
    frameRequested = true;
  }

  function onWheel(event: WheelEvent) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const scrollDelta = parseScrollDelta(event);
    if (event.ctrlKey) {
      const change = Math.pow(1.1, -scrollDelta[1] / 20);
      if (scale * change > 5) return;
      scale *= change;
      let [x, y] = parsePosition(event);

      offset = [
        x - (1 / change) * (x - offset[0]),
        y - (1 / change) * (y - offset[1]),
      ];
      requestFrame();
    } else if (event.shiftKey) {
      offset[0] += scrollDelta[1] / renderer.frameView.scale;
      requestFrame();
    } else if (event.altKey) {
      offset[1] += scrollDelta[1] / renderer.frameView.scale;
      requestFrame();
    } else {
      offset[0] += scrollDelta[0] / renderer.frameView.scale;
      offset[1] += scrollDelta[1] / renderer.frameView.scale;
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

    renderer.frameView.width = canvas.width;
    renderer.frameView.height = canvas.height;
    requestFrame();
  }

  function parsePosition(event: WheelEvent | MouseEvent) {
    const scale = renderer.frameView.scale;

    return [
      ((event.clientX - div.offsetLeft) * window.devicePixelRatio) / scale +
        offset[0],
      ((event.clientY - div.offsetTop) * window.devicePixelRatio) / scale +
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

function parseScrollDelta(event: WheelEvent): [number, number] {
  return event.deltaMode === 0
    ? [event.deltaX, event.deltaY]
    : [
        event.deltaX * (getScrollLineHeight() || 16),
        event.deltaY * (getScrollLineHeight() || 16),
      ];
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
    options?: { capture?: boolean; passive?: boolean },
  ): any;
  removeEventListener<K extends keyof Map>(
    k: K,
    listener: (event: Map[K]) => any,
  ): any;
}): <Key extends keyof Map>(
  scope: (cleanup: () => void) => void,
  event: Key,
  listener: (event: Map[Key]) => void,
  options?: { capture?: boolean; passive?: boolean },
) => void {
  return (scope, event, listener, options) => {
    target.addEventListener(event, listener, options);
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
