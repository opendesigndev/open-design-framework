declare module "#env" {
  export type Env = {
    createCanvas: () => HTMLCanvasElement;
    fetch(url: string): Promise<{
      arrayBuffer: () => Promise<ArrayBuffer>;
    }>;
    parseImage(
      buffer: Uint8Array,
      signal?: AbortSignal
    ): Promise<{ width: number; height: number; data: Uint8ClampedArray }>;
  };
  export declare const env: Env;
}
