export function mergeUint8Arrays(chunks: readonly Uint8Array[]) {
  const merged = new Uint8Array(
    chunks.reduce((v, chunk) => v + chunk.length, 0)
  );
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return merged;
}

export type DetachedPromiseControls<T> = {
  resolve: (v: T) => void;
  reject: (err: any) => void;
  promise: Promise<T>;
};
export function detachPromiseControls<T>(): DetachedPromiseControls<T> {
  let resolve!: (v: T) => void;
  let reject!: (err: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
