export function throttle(
  fn: (...args: any[]) => void,
  delay: number,
): (...args: any[]) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: any[]) {
    if (!timer) {
      fn.apply(this, args);
      timer = setTimeout(() => {
        timer = null;
      }, delay);
    }
  };
}
