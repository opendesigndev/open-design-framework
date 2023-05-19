import type { Transformation } from "@opendesign/universal";

/**
 * Extracts angle from transformation matrix
 * @param matrix transformation matrix
 * @returns angle in degrees
 */
export function extractAngleFromMatrix(matrix: Transformation): number {
  const [a, b] = matrix;
  const angle = Math.atan2(b, a);
  return (angle * 180) / Math.PI;
}
