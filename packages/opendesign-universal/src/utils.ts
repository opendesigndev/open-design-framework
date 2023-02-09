export type DetachedPromiseControls<T> = {
  resolve: (v: T) => void;
  reject: (err: any) => void;
  promise: Promise<T>;
};
// TODO: import this from octopus/common once we make sure it treeshakes properly
export function detachPromiseControls<T>(): DetachedPromiseControls<T> {
  let resolve!: (v: T) => void;
  let reject!: (err: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * Computes SHA-256 hash of input string, or returns null if this environment
 * does not have sufficient crypto support.
 *
 * @param input string
 * @returns base16 digest, or null
 */
export async function hashString(input: string): Promise<string | null> {
  const TextEncoder = (globalThis as any).TextEncoder;
  const subtle = (globalThis as any).crypto?.subtle;
  if (!TextEncoder || !subtle?.digest) return null;
  const t = new TextEncoder();
  const value: ArrayBuffer = await subtle.digest("sha-256", t.encode(input));
  return base16Buffer(value);
}

const base16 = "0123456789abcdef";
function base16Buffer(buffer: ArrayBuffer) {
  return Array.from(
    new Uint8Array(buffer),
    (item) => base16[item % 16] + base16[Math.floor(item / 16)],
  ).join("");
}
