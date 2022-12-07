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
