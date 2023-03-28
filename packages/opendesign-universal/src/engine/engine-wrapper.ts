import type { ODE, Result } from "@opendesign/engine";
import createEngineWasm from "@opendesign/engine";
import type {
  LayerType,
  LayerType_Map,
  ParseError,
  ParseError_Type,
  ParseError_Type_Map,
  Result_Map,
  TransformationBasis,
  TransformationBasis_Map,
} from "@opendesign/engine/exports.js";
import { warn } from "@opendesign/env";

import { engineVersion } from "../../index.js";
import type { Scope } from "./memory.js";

///
/// Configuration
///
type FunctionsWithDestroy =
  | `${string}_list${string}`
  | `${string}_create${string}`
  | `create${string}`;
const destroyers: Pick<
  {
    [key in keyof ODE]: readonly [number, keyof ODE];
  },
  FunctionsWithDestroy & keyof ODE
> = {
  createDesign: [1, "destroyDesign"],
  createDesignImageBase: [2, "destroyDesignImageBase"],
  createEngine: [0, "destroyEngine"],
  design_listMissingFonts: [1, "destroyMissingFontList"],
  component_listMissingFonts: [1, "destroyMissingFontList"],
  createRendererContext: [1, "destroyRendererContext"],
  pr1_createAnimationRenderer: [2, "pr1_destroyAnimationRenderer"],
  component_listLayers: [1, "destroyLayerList"],
};

type ParsingFunctions =
  | "design_addComponentFromOctopusString"
  | "pr1_component_loadAnimation"
  | "component_addLayer";
const parsers: Pick<
  {
    [key in keyof ODE]: [parseErrorIndex: number, sourceIndex: number];
  },
  ParsingFunctions
> = {
  design_addComponentFromOctopusString: [4, 3],
  pr1_component_loadAnimation: [2, 1],
  component_addLayer: [4, 3],
};

type Enums = MakeSureWeHaveAllEnums<{
  Result: [Result_Map, Result];
  LayerType: [LayerType_Map, LayerType];
  ParseError_Type: [ParseError_Type_Map, ParseError_Type];
  TransformationBasis: [TransformationBasis_Map, TransformationBasis];
}>;

///
/// Following uses the configuration to generate memory-safe bindings
///

export async function loadEngine(
  wasmLocation: string | undefined,
): Promise<WrappedODE> {
  // we'll want to change how this works to avoid expected errors
  // simplest way is to restore older revision from git, but change engine to
  // export value of new URL('ode.wasm', import.meta.url) and use that.
  let rawOde: ODE;
  if (!wasmLocation) {
    try {
      rawOde = await createEngineWrap();
    } catch (e) {
      warn(
        "Failed to load wasm from local server. See wasmLocation option docs for more info.",
      );
      rawOde = await createEngineWrap(
        "https://unpkg.com/@opendesign/engine@" + engineVersion + "/ode.wasm",
      );
    }
  } else if (wasmLocation === "unpkg") {
    rawOde = await createEngineWrap(
      "https://unpkg.com/@opendesign/engine@" + engineVersion + "/ode.wasm",
    );
  } else if (wasmLocation === "local") {
    rawOde = await createEngineWrap();
  } else {
    rawOde = await createEngineWrap(wasmLocation);
  }

  function callable(k: string, v: any) {
    const parser = (parsers as any)[k] as
      | [parseErrorIndex: number, sourceIndex: number]
      | undefined;

    return (...args: any) => {
      const result = v.apply(rawOde, args);
      if (parser) {
        throwOnParseError(wrapped, result, args[parser[0]], args[parser[1]]);
      } else {
        throwOnError(wrapped, result);
      }
    };
  }

  const wrapped: WrappedODE = Object.fromEntries(
    Object.entries(rawOde)
      .map(([k, v]: [string, any]) => {
        // embind errors
        if (["InternalError", "BindingError", "UnboundTypeError"].includes(k))
          return null;

        if (typeof v === "number") {
          return [k, v];
        } else if (k === "MemoryBuffer") {
          return [k, MemoryBuffer(rawOde)];
        } else if (typeof v === "number") {
          //console.log("constant", k);
        } else if (v.prototype?.constructor !== v) {
          //console.log("???", k, v);
        } else if (k in destroyers) {
          // functions which require using another destroy function
          const [index, destroyName] =
            destroyers[k as any as keyof typeof destroyers];
          const destroy = (rawOde as any)[destroyName];
          const fn = callable(k, v);

          return [
            k,
            (scope: Scope, ...args: any[]) => {
              fn(...args);

              scope(() => destroy.call(rawOde, args[index]));
            },
          ];
        } else if (
          Object.keys(v.prototype).length ||
          ("argCount" in v && v.argCount === undefined)
        ) {
          // structs bound using _class
          return [
            k,
            (scope: Scope, ...args: any) => {
              const instance = new v(...args);
              scope(() => void instance.delete());
              return instance;
            },
          ];
        } else if (v.argCount) {
          // Functions
          return [k, callable(k, v)];
        } else if (Object.keys(v).length) {
          // Enums
          let decoder: undefined | Map<number, number> = undefined;
          function decodeEnum(code: { value: number }) {
            if (!decoder) {
              decoder = new Map();
              for (const [decoded, obj] of Object.entries(v) as any) {
                decoder.set(obj.value, decoded);
              }
            }
            return decoder.get(code.value) ?? "UNKNOWN_" + code.value;
          }
          return [k, decodeEnum];
        }
        return null;
      })
      .filter(notNull),
  ) as any;
  wrapped.raw = rawOde;
  return wrapped;
}

function createEngineWrap(file?: string): Promise<ODE> {
  return createEngineWasm(file ? { locateFile: () => file } : {});
}

export type WrappedODE = {
  [key in keyof ODE]: key extends "MemoryBuffer"
    ? ReturnType<typeof MemoryBuffer>
    : key extends EnumNames
    ? (value: Enums[key][1]) => keyof Enums[key][0] | `UNKNOWN_${number}`
    : key extends `destroy${string}`
    ? never
    : key extends FunctionsWithDestroy
    ? ODE[key] extends (...args: infer Args) => Result
      ? (scope: Scope, ...args: Args) => void
      : never
    : ODE[key] extends new (...args: infer Args) => infer Obj
    ? Obj extends { delete(): void }
      ? (scope: Scope, ...args: Args) => Obj
      : never
    : ODE[key] extends (...args: infer Args) => Result
    ? (...args: Args) => void
    : never;
} & { raw: ODE };
function notNull<T>(value: T | null): value is T {
  return value !== null;
}

function throwOnError(
  ode: WrappedODE,
  result: Result,
): asserts result is { value: Result_Map["OK"] } {
  if (result.value) {
    const code = `${ode.Result(result)} (${result.value})`;
    throw new Error(code);
  }
}

type EnumNames = {
  // Enum is an object with at least one key, and all of its keys are of type { value: number }
  [k in keyof ODE]: ODE[k] extends {
    [t in keyof ODE[k]]: { value: number };
  }
    ? keyof ODE[k] extends never
      ? never
      : k
    : never;
}[keyof ODE];
type MakeSureWeHaveAllEnums<
  T extends {
    [e in EnumNames]: [{ [key: string]: number }, { value: number }];
  },
> = T;

function MemoryBuffer(ode: ODE) {
  /**
   * Creates MemoryBuffer for given length. Call withData to get MemoryBuffer handle
   * to pass to engine. Note that calling withData multiple times is supported, but
   * the memory will get overwritten. However, this should be safe if previous
   * engine call finished before this is done.
   *
   * Above means, that it is safe to reuse then same memory buffer across multiple
   * calls if the next calls after previous one returns.
   *
   * @param ode
   * @param scope
   * @param initialCapacity
   * @returns object for working with memory buffer
   */
  return function createMemoryBuffer(
    scope: Scope,
    initialCapacity: number = 0,
  ) {
    const buffer = new ode.MemoryBuffer();
    scope(() => {
      ode.destroyMemoryBuffer(buffer);
      buffer.delete();
    });
    if (initialCapacity) {
      ode.allocateMemoryBuffer(buffer, initialCapacity);
    }

    return {
      withData: (data: ArrayLike<number>) => {
        if (data.length !== buffer.length) {
          if (buffer.length) ode.reallocateMemoryBuffer(buffer, data.length);
          else ode.allocateMemoryBuffer(buffer, data.length);
        }
        const view = new Uint8Array(
          ode.HEAP8.buffer,
          buffer.data,
          buffer.length,
        );
        view.set(data);
        return buffer;
      },
    };
  };
}

function throwOnParseError(
  ode: WrappedODE,
  result: Result,
  parseError: ParseError,
  source: string,
): asserts result is { value: Result_Map["OK"] } {
  if (result.value) {
    const code = `${ode.Result(result)} (${(result as any).value})`;
    let error = new Error(code);
    const type: any = parseError.type;
    if (type.value) {
      const position = parseError.position;
      const lines = source.slice(0, position).split("\n");
      const decoded = ode.ParseError_Type(type);
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
