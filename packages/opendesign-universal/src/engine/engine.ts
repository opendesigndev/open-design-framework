import type {
  DesignHandle,
  PR1_AnimationRendererHandle,
  PR1_FrameView,
} from "@opendesign/engine";

import type { WasmLocationSpecifier, WrappedODE } from "./engine-wrapper.js";
import { loadEngine } from "./engine-wrapper.js";
import type { Scope } from "./memory.js";
import { readStringRef } from "./memory.js";
import { createStringRef } from "./memory.js";
import { automaticScope, detachedScope } from "./memory.js";

export function design_listMissingFonts(ode: WrappedODE, design: DesignHandle) {
  return automaticScope((scope) => {
    const fontList = ode.design_listMissingFonts(scope, design);

    const fonts: string[] = [];
    for (let i = 0; i < fontList.n; ++i) {
      const font = ode.StringList_getEntry(fontList, i);
      fonts.push(readStringRef(ode, font));
    }
    return fonts;
  });
}

export type Renderer = {
  handle: PR1_AnimationRendererHandle;
  frameView: PR1_FrameView;
  time: number;
};

function createCanvasSelector(
  ode: WrappedODE,
  scope: Scope,
  canvas: any /* HTMLCanvasElement */,
) {
  let uniqueClass: string;
  // TODO: modify engine to add option to pass in canvas instead of using selectors
  // https://emscripten.org/docs/api_reference/html5.h.html#registration-functions
  if ((globalThis as any).document) {
    let document = (globalThis as any).document;
    uniqueClass = "ode-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
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
  return selector;
}

export async function initEngine(
  canvas: any /* HTMLCanvasElement */,
  wasmLocation?: WasmLocationSpecifier,
) {
  const ode = await loadEngine(wasmLocation);
  const { scope, destroy: finish } = detachedScope();

  try {
    const engineAttributes = ode.initializeEngineAttributes();
    const engine = ode.createEngine(scope, engineAttributes);

    const rendererCtx = automaticScope((tmpScope) =>
      ode.createRendererContext(
        scope,
        engine,
        createCanvasSelector(ode, tmpScope, canvas),
      ),
    );
    const design = ode.createDesign(scope, engine);
    const imageBase = ode.createDesignImageBase(scope, rendererCtx, design);

    const renderers = new Set<Renderer>();

    return {
      ode,
      engine,
      rendererContext: rendererCtx,
      design,
      designImageBase: imageBase,
      renderers,
      redraw() {
        for (const r of renderers) {
          ode.pr1_animation_drawFrame(r.handle, r.frameView, r.time / 1000);
        }
      },
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
