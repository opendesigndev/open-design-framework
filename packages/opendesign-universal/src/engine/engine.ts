import type {
  DesignHandle,
  EngineHandle,
  RendererContextHandle,
} from "@opendesign/engine";
import createEngineWasm from "@opendesign/engine";

import {
  automaticScope,
  createObject,
  createStringRef,
  detachedScope,
} from "./memory.js";

const createEngineAttributes = createObject("EngineAttributes", (ode) => [
  (handle) => ode.initializeEngineAttributes(handle),
]);

const createEngine = createObject("EngineHandle", (ode) => [
  (engine) =>
    automaticScope((scope) => {
      const engineAttributes = createEngineAttributes(ode, scope);
      return ode.createEngine(engine, engineAttributes);
    }),
  ode.destroyEngine,
]);

const createRendererContext = createObject(
  "RendererContextHandle",
  (ode, engine: EngineHandle, canvas: any) => [
    (rendererContext) =>
      automaticScope((scope) => {
        let uniqueClass: string;

        // TODO: modify engine to add option to pass in canvas instead of using selectors
        // https://emscripten.org/docs/api_reference/html5.h.html#registration-functions
        if ((globalThis as any).document) {
          uniqueClass =
            "ode-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
          canvas.classList.add(uniqueClass);
          scope(() => {
            canvas.classList.remove(uniqueClass);
          });
        } else {
          // we do not have document. Let's monkey-patch the global so that Engine
          // still works.
          uniqueClass = "";
          (globalThis as any).document = { querySelector: () => canvas };
          scope(() => {
            delete (globalThis as any).document;
          });
        }
        const selector = createStringRef(ode, scope, "." + uniqueClass);

        return ode.createRendererContext(engine, rendererContext, selector);
      }),
    ode.destroyRendererContext,
  ]
);

const createDesign = createObject(
  "DesignHandle",
  (ode, engine: EngineHandle) => [
    (design) => ode.createDesign(engine, design),
    ode.destroyDesign,
  ]
);

const createDesignImageBase = createObject(
  "DesignImageBaseHandle",
  (ode, rendererContext: RendererContextHandle, design: DesignHandle) => [
    (imageBase) =>
      ode.createDesignImageBase(rendererContext, design, imageBase),
    ode.destroyDesignImageBase,
  ]
);

const createPR1FrameView = createObject("PR1_FrameView");

export async function initEngine(canvas: any /* HTMLCanvasElement */) {
  const ode = await createEngineWasm();
  const { scope, destroy: finish } = detachedScope();

  try {
    const engine = createEngine(ode, scope);
    const rendererCtx = createRendererContext(ode, scope, engine, canvas);
    const design = createDesign(ode, scope, engine);
    const imageBase = createDesignImageBase(ode, scope, rendererCtx, design);

    const frameView = createPR1FrameView(ode, scope);
    frameView.width = canvas.width;
    frameView.height = canvas.height;
    frameView.scale = 1;

    return {
      engine,
      rendererContext: rendererCtx,
      design,
      designImageBase: imageBase,
      frameView,
      destroy() {
        finish();
      },
    };
  } catch (e) {
    finish();
    throw e;
  }
}
export type Engine = Awaited<ReturnType<typeof initEngine>>;
