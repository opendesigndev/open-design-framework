export declare const createCanvas: () => HTMLCanvasElement;
export declare function fetch(
  url: string,
  opts?: any,
): Promise<{
  arrayBuffer: () => Promise<ArrayBuffer>;
}>;
export declare function parseImage(
  buffer: Uint8Array,
  signal?: AbortSignal,
): Promise<{ width: number; height: number; data: Uint8ClampedArray }>;
export declare function warn(...args: any[]): void;

export function requestAnimationFrame(callback: (time: number) => void): number;
export function cancelAnimationFrame(handle: number): void;
