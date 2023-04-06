export declare const createCanvas: () => HTMLCanvasElement | null;

export declare function parseImage(
  buffer: Uint8Array,
  signal?: AbortSignal,
): Promise<{ width: number; height: number; data: Uint8ClampedArray }>;

export function requestAnimationFrame(callback: (time: number) => void): number;
export function cancelAnimationFrame(handle: number): void;

export const crypto: { randomUUID(): string };
export declare function fetch(
  url: string,
  opts?: any,
): Promise<{ arrayBuffer: () => Promise<ArrayBuffer> }>;
