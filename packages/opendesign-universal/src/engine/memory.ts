import type { StringRef } from "@opendesign/engine";

import type { AbortSignal } from "../lib.js";
import { AbortController } from "../lib.js";
import type { WrappedODE } from "./engine-wrapper.js";

export type Scope = (cb: () => void) => void;

/**
 * Helps with making sure that resources are deleted. It immediately invokes
 * its argument, does cleanup and returns whatever the function returned.
 *
 * It passes scope to the callback.
 *
 * ## scope(deleter) function
 *
 * When you call this function, you are making sure that its argument will
 * be called when you exit the scope.
 *
 * cleanup functions will be called in reverse of the order in which they enter
 * the scope.
 *
 * ### Example
 *
 * ```
 * scope(() => console.log('finished'))
 * // it will log finished once it's time to clean up
 * ```
 *
 * ## Examples
 *
 * ```typescript
 * // The following will log 1 2 3
 * const result = automaticScope((scope) => {
 *   console.log(1)
 *   scope(() => console.log(2))
 *   return 3
 * })
 * console.log(result)
 * ```
 *
 * The following will log "setup cleanup" and the error will propagate up
 *
 * ```typescript
 * automaticScope((scope) => {
 *   console.log('setup')
 *   scope(() => console.log('cleanup'))
 *   somePotentiallyFailingCode()
 * })
 * ```
 *
 * Compare with this, where cleanup will never get called if preceding code throws
 *
 * ```typescript
 * console.log('setup')
 * somePotentiallyFailingCode()
 * console.log('cleanup')
 * ```
 *
 * Equivalent code without automaticScope would be, which is easy to mess up and
 * it's inconvenient when multiple cleanups are needed.
 *
 * ```typescript
 * try {
 *   console.log('setup')
 *   somePotentiallyFailingCode()
 * } finally {
 *   console.log('cleanup')
 * }
 * ```
 *
 * @param cb
 * @returns the return value of cb
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
 * @returns the return value of cb
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
 * the same lifetime as the scope. You likely want to wrap this in some kind of
 * try-finally, or use {@link automaticScope} instead.
 *
 * ## Example
 *
 * Let's say you have some object, which needs some ODE object to exist. You can
 * use this function to manage the ODE object's lifetime.
 *
 * ```typescript
 * class Klass {
 *   #lifetime = detachedScope()
 *
 *   constructor() {
 *     this.handle = this.#lifetime.scope(createHandle, deleter)
 *   }
 *
 *   destroy() {
 *     this.#lifetime.destroy()
 *   }
 * }
 * ```
 *
 * Simple example would be:
 *
 * ```typescript
 * const { scope, destroy } = detachedScope()
 * scope(() => console.log('abc'))
 * // ... later
 * destroy() // logs abc
 * ```
 */
export function detachedScope(): {
  scope: Scope;
  signal: AbortSignal;
  destroy: () => void;
} {
  const finalizeables: (() => void)[] = [];
  const scope: Scope = (cb) => {
    finalizeables.push(cb);
  };
  const controller = new AbortController();
  return {
    scope,
    signal: controller.signal,
    destroy() {
      controller.abort();
      for (let i = finalizeables.length - 1; i >= 0; i--) {
        finalizeables[i]();
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

export function createStringRef(ode: WrappedODE, scope: Scope, text: string) {
  return ode.makeString(scope, text);
}

export function readStringRef(ode: WrappedODE, ref: StringRef): string {
  if (ref.length === 0) return "";
  return ode.getString(ref);
}
