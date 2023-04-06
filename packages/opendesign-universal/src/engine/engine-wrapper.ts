import type { ODE } from "@opendesign/engine";
import type { ParseError } from "@opendesign/engine";
import createEngine, { wasm } from "@opendesign/engine";
import { fetch } from "@opendesign/env";

import { engineVersion } from "../../index.js";
import { console } from "../lib.js";
import { detachPromiseControls } from "../utils.js";
import type { Scope } from "./memory.js";

///
/// Configuration
///
type FunctionsWithDestroy = keyof typeof destroyers;
const destroyers = mkDestroyers({
  createDesign: "destroyDesign",
  createDesignImageBase: "destroyDesignImageBase",
  createEngine: "destroyEngine",
  design_listMissingFonts: "destroyMissingFontList",
  component_listMissingFonts: "destroyMissingFontList",
  createRendererContext: "destroyRendererContext",
  pr1_createAnimationRenderer: "pr1_destroyAnimationRenderer",
  component_listLayers: "destroyLayerList",
  makeString: "destroyString",
  makeMemoryBuffer: "destroyMemoryBuffer",
});
function mkDestroyers<
  T extends Pick<
    { [key in keyof ODE]: keyof ODE },
    (
      | `${string}_list${string}`
      | `${string}_create${string}`
      | `create${string}`
      | `make${string}`
    ) &
      keyof ODE
  >,
>(v: T): T {
  return v;
}

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

///
/// Following uses the configuration to generate memory-safe bindings
///

export type WasmLocationSpecifierSingle =
  | string
  | ((spec: { version: string; package: string; filename: string }) => string);
export type WasmLocationSpecifier =
  | WasmLocationSpecifierSingle
  | WasmLocationSpecifierSingle[];

export async function loadEngine(
  wasmLocation: WasmLocationSpecifier = ["local", "unpkg"],
): Promise<WrappedODE> {
  const locations = [wasmLocation].flat();
  if (locations.length < 1)
    throw new Error("Must specify at least on location to load from");
  const controls = detachPromiseControls<never>();
  const odePromise = createEngine({
    // We use instantiateWasm instead of locateFile to be able to respond to
    // 404 on local requests.
    instantiateWasm(info: any, receiveInstance: (instance: any) => void) {
      (async () => {
        for (let i = 0; i < locations.length; ++i) {
          try {
            const location = locations[i];
            const spec = {
              filename: "ode.wasm",
              package: "@opendesign/engine-wasm",
              version: engineVersion,
            };
            if (typeof location !== "string") {
              return await instantiateWasm(location(spec), info);
            } else if (location === "unpkg") {
              const unpkg = `https://unpkg.com/${spec.package}@${spec.version}/${spec.filename}`;
              return await instantiateWasm(unpkg, info);
            } else if (location === "local") {
              return await instantiateWasm(wasm, info);
            } else {
              return await instantiateWasm(location, info);
            }
          } catch (e) {
            if (i === locations.length - 1) throw e;
            console.warn(
              "Failed to load wasm from local server. See wasmLocation option docs for more info.",
            );
            console.warn(e);
          }
        }
        throw new Error("Failed to load wasm");
      })().then(receiveInstance, controls.reject);
    },
  });
  const rawOde = await Promise.race([odePromise, controls.promise]);

  const wrapped: WrappedODE = Object.fromEntries(
    Object.entries(rawOde)
      .map(([k, v]: [string, any]) => {
        if (k in destroyers) {
          // functions which require using another destroy function
          const destroyName = destroyers[k as any as keyof typeof destroyers];
          const destroy = (rawOde as any)[destroyName];
          if (!destroy)
            throw new Error("Failed to find destroy function " + destroyName);

          const parser = (parsers as any)[k] as
            | [parseErrorIndex: number, sourceIndex: number]
            | undefined;

          const name = `wrap(${k})`;
          const fn = {
            [name]: (scope: Scope, ...args: any[]) => {
              let result: any;
              if (parser) {
                try {
                  result = v.apply(rawOde, args);
                } catch (error: any) {
                  throwParseError(
                    wrapped,
                    error,
                    args[parser[0]],
                    args[parser[1]],
                  );
                }
              } else {
                result = v.apply(rawOde, args);
              }

              scope(() => destroy.call(rawOde, result));
              return result;
            },
          }[name];

          return [k, fn];
        }

        return [k, v];
      })
      .filter(notNull),
  ) as any;
  return wrapped;
}

async function instantiateWasm(path: string, info: any) {
  const response = await fetch(path, { credentials: "same-origin" });
  const result = await (globalThis as any).WebAssembly.instantiateStreaming(
    response,
    info,
  );
  return result.instance;
}

export type WrappedODE = {
  [key in keyof ODE]: key extends FunctionsWithDestroy
    ? ODE[key] extends (...args: infer Args) => infer R
      ? (scope: Scope, ...args: Args) => R
      : never
    : ODE[key];
};
function notNull<T>(value: T | null): value is T {
  return value !== null;
}

function throwParseError(
  ode: WrappedODE,
  error: Error,
  parseError: Partial<ParseError>,
  source: string,
): never {
  const type = parseError.type;
  if (type) {
    const position = parseError.position;
    const lines = source.slice(0, position).split("\n");
    const code = (error as any).code;
    error = new Error(
      `${error.message} - ${type} at position ${lines.length}:${
        lines.slice(-1)[0].length + 1
      } (byte ${position} out of ${source.length})`,
    );
    (error as any).position = position;
    (error as any).parseError = type;
    (error as any).code = code;
  }
  throw error;
}
