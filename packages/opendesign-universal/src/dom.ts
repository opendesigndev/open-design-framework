import type { ImportedClipboardData } from "../index.js";
import { importFromClipboardData } from "../index.js";
import type { Editor } from "./editor.js";
import { editorGetEngine } from "./editor.js";
import { editorGetCanvas } from "./editor.js";
import type { Renderer } from "./engine/engine.js";
import { detachedScope } from "./engine/memory.js";
import type { PageNodeImpl } from "./nodes/page.js";

export type MountOptions = {
  disableGestures?: boolean;

  /**
   * Changes where we listen to events. Defaults to parent.
   *
   * This allows you to set a element further up in hierarchy to allow a sibling
   * element which overlaps with parent without having to set pointer-events: none;
   */
  eventTarget?: HTMLElement;
};

export type MountResult = {
  /**
   * Unmounts the canvas from div and finalizes any resources connected to it.
   */
  destroy: () => void;

  /**
   * Extracts position from event and converts it to page coordinates. Useful
   * for implementing your own click/drag/... event handlers.
   */
  extractEventPosition(
    event: WheelEvent | MouseEvent | PointerEvent,
  ): readonly [number, number];

  /**
   * Adds function to be notified about certain event.
   *
   * @param eventName name of the event
   * @param handler function to be called when the event occurs
   * @returns function which unsubscribes from the event
   */
  subscribe<EventName extends keyof MountEventMap>(
    eventName: EventName,
    handler: MountEventHandler<EventName>,
  ): () => void;

  /**
   * Returns information about current viewport
   */
  getViewport(): Viewport;

  /**
   * **For internal use only** it's not the part of public API and may change
   * Forces rendering of the next frame
   */
  _requestFrame(): void;
};

export type MountEventHandler<EventName extends keyof MountEventMap> = (
  event: MountEventMap[EventName],
) => void;

export type Viewport = {
  scale: number;
  offset: readonly [number, number];
  width: number;
  height: number;
  devicePixelRatio: number;
};

export type MountEventMap = {
  viewportChange: { viewport: Viewport };
};

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
 * @param parent
 * @param options
 * @returns
 */
export function mount(
  editor: Editor,
  parent: HTMLDivElement,
  options?: MountOptions,
): MountResult {
  const canvas: HTMLCanvasElement = editorGetCanvas(editor);
  const engine = editorGetEngine(editor);
  const eventTarget = options?.eventTarget ?? parent;

  const { scope, signal, destroy } = detachedScope();
  parent.appendChild(canvas);
  scope(() => void canvas.parentElement?.removeChild(canvas));
  parent.style.boxSizing = "border-box";
  canvas.style.position = "absolute";
  canvas.style.transformOrigin = "top left";
  let frameRequested = false;
  let offset: [number, number] = [0, 0];
  let scale = 1;
  let width = 0;
  let height = 0;

  const handlers: {
    [key in keyof MountEventMap]?: MountEventHandler<key>[];
  } = {};

  const rendererHandle = engine.ode.pr1_createAnimationRenderer(
    scope,
    engine.rendererContext,
    (editor.currentPage as PageNodeImpl).__artboard?.__component!,
    engine.designImageBase,
  );

  const frameView = {
    width: canvas.width,
    height: canvas.height,
    scale: 0, // NOTE: this forces first draw
    offset: [0, 0] as const,
  };
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
  window.addEventListener("resize", onResize, { signal });
  // This will get called any other time
  const observer = new ResizeObserver(onResize);
  observer.observe(parent);
  scope(() => observer.disconnect());

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
        _requestFrame();
      }
    },
    { signal },
  );

  if (!options?.disableGestures) {
    eventTarget.addEventListener("wheel", onWheel, { passive: false, signal });

    eventTarget.addEventListener(
      "pointerdown",
      (event: PointerEvent) => {
        if (event.buttons === 4 || performance.now() - space < 1000)
          eventTarget.setPointerCapture(event.pointerId);
      },
      { signal },
    );

    eventTarget.addEventListener(
      "pointermove",
      (event: PointerEvent) => {
        if (event.buttons === 4 || performance.now() - space < 1000)
          eventTarget.setPointerCapture(event.pointerId);
        if (!eventTarget.hasPointerCapture(event.pointerId)) return;
        offset[0] -= (event.movementX / scale) * window.devicePixelRatio;
        offset[1] -= (event.movementY / scale) * window.devicePixelRatio;
        _requestFrame();
      },
      { signal },
    );
    eventTarget.addEventListener(
      "pointerup",
      (event) => void eventTarget.releasePointerCapture(event.pointerId),
      { signal },
    );

    eventTarget.addEventListener(
      "pointermove",
      (event: PointerEvent) => {
        if (event.buttons === 4 || performance.now() - space < 1000)
          eventTarget.setPointerCapture(event.pointerId);
        if (!eventTarget.hasPointerCapture(event.pointerId)) return;
        offset[0] -= (event.movementX / scale) * window.devicePixelRatio;
        offset[1] -= (event.movementY / scale) * window.devicePixelRatio;
        _requestFrame();
      },
      { signal },
    );
    eventTarget.addEventListener(
      "pointerup",
      (event) => void eventTarget.releasePointerCapture(event.pointerId),
      { signal },
    );
  }

  return {
    destroy,
    extractEventPosition,
    subscribe,
    getViewport,
    _requestFrame: _requestFrame,
  };

  function subscribe<EventName extends keyof MountEventMap>(
    event: EventName,
    handler: MountEventHandler<EventName>,
  ) {
    let list = handlers[event];
    if (!list) {
      list = [];
      handlers[event] = list;
    }
    list.push(handler);
    return () => void list?.splice(list?.indexOf(handler), 1);
  }

  function getViewport(): Viewport {
    return {
      devicePixelRatio: window.devicePixelRatio,
      height,
      offset,
      scale,
      width,
    };
  }

  function draw() {
    frameRequested = false;

    renderer.frameView.width = width;
    renderer.frameView.height = height;
    renderer.frameView.offset = offset;
    renderer.frameView.scale = scale;

    engine.ode.pr1_animation_drawFrame(rendererHandle, renderer.frameView, 0);
    if (handlers.viewportChange?.length) {
      const event = { viewport: getViewport() };
      for (const handler of handlers.viewportChange) {
        handler(event);
      }
    }
  }

  function _requestFrame() {
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
      let [x, y] = extractEventPosition(event);

      offset = [
        x - (1 / change) * (x - offset[0]),
        y - (1 / change) * (y - offset[1]),
      ];
      _requestFrame();
    } else if (event.shiftKey) {
      offset[0] += (scrollDelta[1] || scrollDelta[0]) / scale;
      _requestFrame();
    } else if (event.altKey) {
      offset[1] += scrollDelta[1] / scale;
      _requestFrame();
    } else {
      offset[0] += scrollDelta[0] / scale;
      offset[1] += scrollDelta[1] / scale;
      _requestFrame();
    }
  }

  function onResize() {
    const rect = parent.getBoundingClientRect();
    const newWidth = rect.width * window.devicePixelRatio;
    const newHeight = rect.height * window.devicePixelRatio;
    if (canvas.width === newWidth && canvas.height === newHeight) {
      return;
    }
    canvas.width = newWidth;
    canvas.height = newHeight;
    canvas.style.transform = `scale(${1 / window.devicePixelRatio})`;

    width = canvas.width;
    height = canvas.height;
    // NOTE: this is explicitly not requestFrame, because that one causes flickering
    draw();
  }

  function extractEventPosition(event: WheelEvent | MouseEvent | PointerEvent) {
    const scale = renderer.frameView.scale;
    const rect = parent.getBoundingClientRect();

    return [
      ((event.clientX - rect.left) * window.devicePixelRatio) / scale +
        offset[0],
      ((event.clientY - rect.top) * window.devicePixelRatio) / scale +
        offset[1],
    ] as const;
  }
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
 * Reads data from clipboard paste event and converts them to a .octopus file.
 * Depending on the source of pasted data, some information might filled for it
 * to be complete .octopus.
 *
 * You can import this into editor using .paste method.
 *
 * @returns object representing parsed .octopus file
 */
export function importFromClipboard(
  input?: ClipboardEvent | string,
): Promise<ImportedClipboardData | string | null> {
  // NOTE: do not convert this to async function due to differences in user activation criteria
  const dataMaybePromise =
    typeof input === "string"
      ? input
      : input
      ? input.clipboardData?.getData("text/plain")
      : navigator.clipboard.readText();

  return Promise.resolve(dataMaybePromise).then((data) =>
    importFromClipboardData(data).then((imported) => imported ?? data ?? null),
  );
}
