import type { ODE, Result, String, StringRef } from "@opendesign/engine";

import type { AbortSignal } from "../lib.js";
import { AbortController } from "../lib.js";
import type { KeysOfType } from "./engine-utils.js";

type Destroyer<Args extends readonly unknown[]> = (...args: Args) => unknown;
type ScopeArgs<Args extends readonly unknown[] = unknown[]> = [
  ...Args,
  Destroyer<Args>,
];
type Scope = <Args extends readonly unknown[]>(
  ...args: ScopeArgs<Args>
) => Args[0];

/**
 * Helps with making sure that resources are deleted. It immediately invokes
 * its argument, does cleanup and returns whatever the function returned.
 *
 * It passes scope to the callback.
 *
 * ## scope(...) function
 *
 * When you call this function, you are making sure that it's last argument will
 * be called when you exit the scope.
 *
 * The signature is `scope(result?, ...args, deleter)`
 *
 * deleter will receive `(result, ...args)` as its arguments and will be called
 * when it's time to clean up.
 *
 * the scope function will return `result` (first argument).
 *
 * cleanup functions should be called in reverse of the order in which they are called
 *
 * ## Example
 *
 * ```
 * let a = scope(1, 2, (...args) => console.log(a, b))
 * // a will be 1, and it will log 1,2
 *
 * scope(() => console.log('finished'))
 * // it will log finished once it's time to clean up
 *
 * ## Example
 *
 * ```typescript
 * // The following will log 1 2 3
 * const result = automaticScope((scope) => {
 *   console.log(1)
 *   scope(() => console.log(2))
 *   return 3
 * })
 * console.log(result)
 *
 * // The following will log 1 2 and the error will propagate up
 * const result = automaticScope((scope) => {
 *   console.log(1)
 *   scope(() => console.log(2))
 *   throw new Error('fail')
 * })
 * console.log(result)
 * ```
 *
 * @param cb
 * @returns
 */
export function automaticScope<T>(cb: (scope: Scope) => T): T {
  const registry = detachedScope();
  try {
    return cb(registry.scope);
  } finally {
    registry.destroy();
  }
}

/**
 * Similar to {@link automaticScope}, but it awaits the result first.
 *
 * @param cb
 * @returns
 */
export async function automaticScopeAsync<T>(
  cb: (Finalizer: Scope) => Promise<T>,
): Promise<T> {
  const registry = detachedScope();
  try {
    return await cb(registry.scope);
  } finally {
    registry.destroy();
  }
}

/**
 * Creates scope which you can manually destroy. Also returns AbortSignal with
 * the same lifetime as the scope.
 */
export function detachedScope(): {
  scope: Scope;
  signal: AbortSignal;
  destroy: () => void;
} {
  const finalizeables: ScopeArgs<any[]>[] = [];
  const scope: Scope = (...args) => {
    finalizeables.push(args as any);
    return args[0];
  };
  const controller = new AbortController();
  return {
    scope,
    signal: controller.signal,
    destroy() {
      controller.abort();
      for (let i = finalizeables.length - 1; i >= 0; i--) {
        const args = finalizeables[i];
        const [destroyer] = args.splice(-1, 1);
        destroyer(...args);
      }
    },
  };
}

/**
 * @internal @deprecated
 * @param args
 * @returns
 */
export const leakMemory: Scope = (...args) => args[0];

/**
 * Calls delete member function on arg.
 *
 * ## Example
 *
 * ```typescript
 * // changing
 * const thing = getAThing()
 * // to this
 * const thing = scope(getAThing(), deleter)
 * // will make sure that thing gets properly deleted
 * ```
 *
 * @param arg
 */
export function deleter(arg: { delete: () => void }) {
  arg.delete();
}

const stringRefMap = new WeakMap<StringRef, { string: String; ode: ODE }>();
function deleteStringRef(ref: StringRef) {
  const entry = stringRefMap.get(ref);
  if (!entry)
    throw new Error(
      "Can only delete refs created with createStringRef function",
    );
  const { ode, string } = entry;
  ref.delete();
  ode.destroyString(string);
  string.delete();
}

export function createStringRef(ode: ODE, scope: Scope, text: string) {
  const string = new ode.String(text);
  const ref = string.ref();

  stringRefMap.set(ref, { string, ode });
  return scope(ref, deleteStringRef);
}

/**
 * This function helps with creation and destruction of Engine objects.
 *
 * To explain how it works, we first need to understand the stages each Engine
 * object undergoes.
 *
 * 1. create handle
 * 2. initialize the object
 * 3. do something with the object
 * 4. deinitialize the object
 * 5. destroy the handle
 *
 * Creating object and handle is simple, but managing *deterministic* object
 * destruction is more complicated. This function helps you create initialization
 * function which helps with all that. Let's look at an example:
 *
 * ```typescript
 * const createDesign = createObject(
 *   'DesignHandle',
 *   (ode, engine: EngineHandle) => [
 *     (design) => { ode.createDesign(engine, design); },
 *     ode.destroyDesign,
 *   ]
 * );
 *
 * // later
 * const design = createDesign(ode, scope, engine)
 * ```
 *
 * Note the following:
 * - only lifecycle handling is passing a `scope` argument. Everything else is
 *   automatic.
 * - you do not have to handle almost anything - just pass create and destroy functions.
 *
 * Okay so, the arguments are:
 * - type of the object handle as a string - a key into ODE
 * - configuration function
 *
 * The configuration function takes ODE and the extra arguments and returns
 * array containing init function and finish function.
 *
 * Init function is usually the most complicated part. Everything else is handled
 * automatically. Hope this helps.
 *
 * Last note: if init or finish returns a `number`, then it is assumed to be error
 * code from engine. It will be checked and if it is non-zero, it will be yeeted
 * as a javascript error. Wrap it in a function if you do not want this.
 *
 * @param descriptor
 * @returns
 */
export function createObject<
  Name extends KeysOfType<ODE, new () => { delete(): void }>,
  Args extends readonly any[] = [],
>(
  name: Name,
  descriptor?: (
    ode: ODE,
    ...args: Args
  ) => [
    init?: (handle: InstanceType<ODE[Name]>) => void | Result,
    finish?: (handle: InstanceType<ODE[Name]>) => void | Result,
  ],
) {
  /**
   * This is a function to create Engine object. Pass in loaded Engine, scope
   * and remaining type arguments. You will receive a handle which you can use
   * until you exit the specified scope.
   */
  return function createObjectImpl(ode: ODE, scope: Scope, ...args: Args) {
    const Cls = ode[name];
    const [init, finish] = descriptor?.(ode, ...args) ?? [];
    const handle: InstanceType<ODE[Name]> = scope(new Cls(), deleter) as any;
    check(name, init?.(handle));
    if (finish) scope(handle, (_) => check(name, finish(handle)));
    return handle;
  };
}

function check(type: string, v: void | Result) {
  if (
    typeof v === "object" &&
    v &&
    "value" in v &&
    typeof v.value === "number" &&
    v.value !== 0
  ) {
    throw new Error(
      "ODE call for object " + type + " failed with code " + v.value,
    );
  }
}
