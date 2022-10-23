import type * as ODE from "@opendesign/engine";
import type { ODENative } from "@opendesign/engine";

type Destroyer<Args extends readonly unknown[]> = (...args: Args) => unknown;
type ScopeArgs<Args extends readonly unknown[] = unknown[]> = [
  ...Args,
  Destroyer<Args>
];
type Scope = <Args extends readonly unknown[]>(
  ...args: ScopeArgs<Args>
) => Args[0];

export function automaticScope<T>(cb: (Finalizer: Scope) => T): T {
  const registry = detachedScope();
  try {
    return cb(registry.scope);
  } finally {
    registry.destroy();
  }
}

export function detachedScope() {
  const finalizeables: ScopeArgs<any[]>[] = [];
  const scope: Scope = (...args) => {
    finalizeables.push(args as any);
    return args[0];
  };
  return {
    scope,
    destroy() {
      for (let i = finalizeables.length - 1; i >= 0; i--) {
        const args = finalizeables[i];
        const [destroyer] = args.splice(-1, 1);
        destroyer(...args);
      }
    },
  };
}

function deleter(arg: { delete: () => void }) {
  arg.delete();
}

const stringRefMap = new WeakMap<
  ODE.StringRef,
  { string: ODE.String; ode: ODENative }
>();
function deleteStringRef(ref: ODE.StringRef) {
  const entry = stringRefMap.get(ref);
  if (!entry)
    throw new Error(
      "Can only delete refs created with createStringRef function"
    );
  const { ode, string } = entry;
  ref.delete();
  ode.destroyString(string);
  string.delete();
}

export function createStringRef(ode: ODENative, scope: Scope, text: string) {
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
 * const createDesign = createObject<DesignHandle, [EngineHandle]>(
 *   (ode, engine) => [
 *     ode.DesignHandle,
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
 * Okay so, the type arguments to createObject function are:
 * - type of the object handle
 * - extra arguments required to work with the object
 *
 * JS argument is a function which takes ODE and the extra arguments and returns
 * array containing:
 * - the handle's constructor
 * - init function
 * - finish function
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
  T extends { delete(): void },
  Args extends readonly any[] = []
>(
  descriptor: (
    ode: ODENative,
    ...args: Args
  ) => [
    handleCls: new () => T,
    init?: (handle: T) => void | number,
    finish?: (handle: T) => void | number
  ]
) {
  /**
   * This is a function to create Engine object. Pass in loaded Engine, scope
   * and remaining type arguments. You will receive a handle which you can use
   * until you exit the specified scope.
   */
  return function createObjectImpl(
    ode: ODENative,
    scope: Scope,
    ...args: Args
  ) {
    const [Cls, init, finish] = descriptor(ode, ...args);
    const handle = scope(new Cls(), deleter);
    check(init?.(handle));
    if (finish) scope(handle, (_) => check(finish(handle)));
    return handle;
  };
}

function check(v: unknown) {
  if (typeof v === "number" && v !== 0)
    throw new Error("ODE call failed with code " + v);
}
