/**
 * similar to rust's todo! macro or java's and C#'s NotImplemented Exception
 * just throws an error
 */
export function todo(what?: string): never {
  throw new Error("TODO" + (what ? ": " + what : ""));
}

export type ToDo = unknown;

export function createInternals<Thing extends object, Data>() {
  const wm = new WeakMap<Thing, Data>();
  return {
    get(target: Thing) {
      const res = wm.get(target);
      if (!res) throw new Error("Invalid input");
      return res;
    },
    create(target: Thing, data: Data) {
      wm.set(target, data);
      return target;
    },
  };
}
