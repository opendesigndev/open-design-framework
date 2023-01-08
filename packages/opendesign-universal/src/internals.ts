/**
 * similar to rust's todo! macro or java's and C#'s NotImplemented Exception
 * just throws an error
 */
export function todo(what?: string): never {
  throw new Error("TODO" + (what ? ": " + what : ""));
}

export type ToDo = unknown;

export const queueMicrotask: (cb: () => void) => void =
  (globalThis as any).queueMicrotask ||
  ((cb) => void Promise.resolve().then(cb));

export function generateUUID(): string {
  return (globalThis as any).crypto.randomUUID();
}
