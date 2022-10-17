declare module "#env" {
  export type Env = {
    createCanvas: () => HTMLCanvasElement;
    fetch(url: string): Promise<{
      arrayBuffer: () => Promise<ArrayBuffer>;
    }>;
  };
  export declare const env: Env;
}
