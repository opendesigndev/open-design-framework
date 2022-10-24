import type {
  ComponentHandle,
  DesignHandle,
  DesignImageBaseHandle,
  EngineHandle,
  RendererContextHandle,
  StringRef,
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
          let document = (globalThis as any).document;
          uniqueClass =
            "ode-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
          canvas.classList.add(uniqueClass);
          scope(() => {
            canvas.classList.remove(uniqueClass);
          });
          if (!canvas.parentElement) {
            document.body.appendChild(canvas);
            scope(() => {
              document.body.removeChild(canvas);
            });
          }
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

export const createPR1Renderer = createObject(
  "PR1_AnimationRendererHandle",
  (
    ode,
    ctx: RendererContextHandle,
    component: ComponentHandle,
    imageBase: DesignImageBaseHandle
  ) => [
    (renderer) => {
      return ode.pr1_createAnimationRenderer(
        ctx,
        component,
        renderer,
        imageBase
      );
    },
    ode.pr1_destroyAnimationRenderer,
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

const createComponentMetadata = createObject(
  "ComponentMetadata",
  (ode, page: StringRef, id: StringRef) => [
    (metadata) => {
      metadata.page = page;
      metadata.id = id;
      metadata.position = [0, 0] as any;
    },
  ]
);

export const createComponentFromOctopus = createObject(
  "ComponentHandle",
  (ode, design: DesignHandle, page: string, id: string, octopus: string) => [
    (handle) =>
      automaticScope((scope) => {
        const pageRef = createStringRef(ode, scope, page);
        const idRef = createStringRef(ode, scope, id);
        const octopusRef = createStringRef(ode, scope, octopus);
        const metadata = createComponentMetadata(ode, scope, pageRef, idRef);
        return ode.design_addComponentFromOctopusString(
          design,
          handle,
          metadata,
          octopusRef
        );
      }),
  ]
);

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
      ode,
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