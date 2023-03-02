import type { Transformation } from "@opendesign/engine";

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

/**
 * Multiply two matrices
 *
 * @param a first matrix
 * @param b second matrix
 * @returns product of a and b
 */
export function matrixMultiply(a: number[][], b: number[][]): number[][] {
  let result: number[][] = [];

  // Get the number of rows and columns in matrices a and b
  let aRows: number = a.length;
  let aCols: number = a[0].length;
  let bRows: number = b.length;
  let bCols: number = b[0].length;

  // Check if the matrices can be multiplied
  if (aCols !== bRows) {
    throw new Error("Matrices cannot be multiplied");
  }

  // Initialize the result matrix with zeros
  for (let i = 0; i < aRows; i++) {
    result[i] = [];
    for (let j = 0; j < bCols; j++) {
      result[i][j] = 0;
    }
  }

  // Multiply the matrices
  for (let i = 0; i < aRows; i++) {
    for (let j = 0; j < bCols; j++) {
      for (let k = 0; k < aCols; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }

  return result;
}

/**
 * Convert 6-element transformation array to 3x3 matrix
 *
 * @param transformation transformation array
 * @returns 3x2 matrix
 * @see Transformation
 * @see matrixMultiply
 */
export function transformationToMatrix(
  transformation: Transformation["matrix"],
): number[][] {
  return [
    [transformation[0], transformation[2], transformation[4]],
    [transformation[1], transformation[3], transformation[5]],
    [0, 0, 1],
  ];
}

/**
 * Convert 3x3 matrix to 6-element transformation array
 * @param matrix 3x3 matrix
 * @returns 6-element transformation array
 * @see Transformation
 * @see matrixMultiply
 * @see transformationToMatrix
 */
export function matrixToTransformation(
  matrix: number[][],
): Transformation["matrix"] {
  return [
    matrix[0][0],
    matrix[1][0],
    matrix[0][1],
    matrix[1][1],
    matrix[0][2],
    matrix[1][2],
  ];
}
