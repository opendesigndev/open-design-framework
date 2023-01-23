import type {
  ComponentHandle,
  DesignHandle,
  DesignImageBaseHandle,
  EngineHandle,
  ODENative,
  ParseError,
  ParseError_Type,
  PR1_AnimationRendererHandle,
  PR1_FrameView,
  RendererContextHandle,
  StringRef,
} from "@opendesign/engine";
import type { Result } from "@opendesign/engine";
import createEngineWasm from "@opendesign/engine";
import { warn } from "@opendesign/env";

import { engineVersion } from "../../index.js";
import {
  automaticScope,
  createObject,
  createStringRef,
  deleter,
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
  ],
);

export const createPR1Renderer = createObject(
  "PR1_AnimationRendererHandle",
  (
    ode,
    ctx: RendererContextHandle,
    component: ComponentHandle,
    imageBase: DesignImageBaseHandle,
  ) => [
    (renderer) => {
      return ode.pr1_createAnimationRenderer(
        ctx,
        component,
        renderer,
        imageBase,
      );
    },
    ode.pr1_destroyAnimationRenderer,
  ],
);
const createDesign = createObject(
  "DesignHandle",
  (ode, engine: EngineHandle) => [
    (design) => ode.createDesign(engine, design),
    ode.destroyDesign,
  ],
);

const createDesignImageBase = createObject(
  "DesignImageBaseHandle",
  (ode, rendererContext: RendererContextHandle, design: DesignHandle) => [
    (imageBase) =>
      ode.createDesignImageBase(rendererContext, design, imageBase),
    ode.destroyDesignImageBase,
  ],
);

export const createPR1FrameView = createObject("PR1_FrameView");

const createComponentMetadata = createObject(
  "ComponentMetadata",
  (ode, page: StringRef, id: StringRef) => [
    (metadata) => {
      metadata.page = page;
      metadata.id = id;
      metadata.position = [0, 0] as any;
    },
  ],
);

function createEnumDecoder<Enum>(enumName: string) {
  let decoder: undefined | Map<Enum, keyof Enum> = undefined;
  return function decodeResult(ode: ODENative, code: Enum) {
    if (!decoder) {
      decoder = new Map();
      for (const [k, v] of Object.entries((ode as any)[enumName]))
        (decoder as any).set(v, k);
    }
    return decoder.get(code) ?? "UNKNOWN_" + ((code as any).value as number);
  };
}

const decodeResult = createEnumDecoder<Result>("Result");
const decodeParseErrorType =
  createEnumDecoder<ParseError_Type>("ParseError_Type");

export const createComponentFromOctopus = createObject(
  "ComponentHandle",
  (ode, design: DesignHandle, page: string, id: string, octopus: string) => [
    (handle) =>
      automaticScope((scope) => {
        const pageRef = createStringRef(ode, scope, page);
        const idRef = createStringRef(ode, scope, id);
        const octopusRef = createStringRef(ode, scope, octopus);
        const metadata = createComponentMetadata(ode, scope, pageRef, idRef);
        const parseError = createParseError(ode, scope);
        const result = ode.design_addComponentFromOctopusString(
          design,
          handle,
          metadata,
          octopusRef,
          parseError,
        );
        throwOnParseError(ode, result, parseError, octopus);
      }),
  ],
);

export function throwOnParseError(
  ode: ODENative,
  result: Result,
  parseError: ParseError,
  source: string,
): asserts result is Result.OK {
  if ((result as any).value) {
    const code = `${decodeResult(ode, result)} (${(result as any).value})`;
    let error = new Error(code);
    const type: any = parseError.type;
    if (type.value) {
      const position = parseError.position;
      const lines = source.slice(0, position).split("\n");
      const decoded = decodeParseErrorType(ode, type);
      error = new Error(
        `${code} - ${decoded} (${type.value}) at position ${lines.length}:${
          lines.slice(-1)[0].length + 1
        } (byte ${position} out of ${source.length})`,
      );
      (error as any).position = position;
      (error as any).parseError = decoded;
    }
    (error as any).code = code;
    throw error;
  }
}

export function throwOnError(
  ode: ODENative,
  result: Result,
): asserts result is Result.OK {
  if ((result as any).value) {
    const code = `${decodeResult(ode, result)} (${(result as any).value})`;
    throw new Error(code);
  }
}

export const createBitmapRef = createObject("BitmapRef");

export const createParseError = createObject("ParseError");

export function design_loadFontBytes(
  ode: ODENative,
  design: DesignHandle,
  name: string,
  data: Uint8Array,
  faceName?: string,
) {
  automaticScope((scope) => {
    const ptr = ode._malloc(data.byteLength);
    scope(() => ode._free(ptr));
    const nameRef = createStringRef(ode, scope, name);
    const faceNameRef = createStringRef(ode, scope, faceName ?? "");
    ode.HEAPU8.set(data, ptr);
    const result = ode.design_loadFontBytes(
      design,
      nameRef,
      ptr,
      data.byteLength,
      faceNameRef,
    );
    throwOnError(ode, result);
  });
}

export const createStringList = createObject("StringList");

export function design_listMissingFonts(ode: ODENative, design: DesignHandle) {
  return automaticScope((scope) => {
    const fontList = createStringList(ode, scope);
    const result = ode.design_listMissingFonts(design, fontList);
    throwOnError(ode, result);
    scope(() => ode.destroyMissingFontList(fontList));
    const fonts: string[] = [];
    for (let i = 0; i < fontList.n; ++i) {
      const font = scope(fontList.getEntry(i), deleter);
      fonts.push(font.string());
    }
    return fonts;
  });
}

export type Renderer = {
  handle: PR1_AnimationRendererHandle;
  frameView: PR1_FrameView;
  time: number;
};

export async function initEngine(
  canvas: any /* HTMLCanvasElement */,
  wasmLocation: string | undefined,
) {
  // we'll want to change how this works to avoid expected errors
  // simplest way is to restore older revision from git, but change engine to
  // export value of new URL('ode.wasm', import.meta.url) and use that.
  let ode: ODENative;
  if (!wasmLocation) {
    try {
      ode = await createEngineWrap();
    } catch (e) {
      warn(
        "Failed to load wasm from local server. See wasmLocation option docs for more info.",
      );
      ode = await createEngineWrap(
        "https://unpkg.com/@opendesign/engine@" + engineVersion + "/ode.wasm",
      );
    }
  } else if (wasmLocation === "unpkg") {
    ode = await createEngineWrap(
      "https://unpkg.com/@opendesign/engine@" + engineVersion + "/ode.wasm",
    );
  } else if (wasmLocation === "local") {
    ode = await createEngineWrap();
  } else {
    ode = await createEngineWrap(wasmLocation);
  }

  const { scope, destroy: finish } = detachedScope();

  try {
    const engine = createEngine(ode, scope);
    const rendererCtx = createRendererContext(ode, scope, engine, canvas);
    const design = createDesign(ode, scope, engine);
    const imageBase = createDesignImageBase(ode, scope, rendererCtx, design);

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

function createEngineWrap(file?: string): Promise<ODENative> {
  // TODO: add types for function argument to engine
  // @ts-expect-error
  return createEngineWasm(file ? { locateFile: () => file } : {});
}
