export function decomposeMatrix(
  matrix: readonly [number, number, number, number, number, number],
) {
  const [M11, M12, M21, M22, M31, M32] = matrix;
  const scaleX = Math.sqrt(M11 * M11 + M12 * M12);

  const rotate = Math.atan2(M12, M11);
  const shear = Math.atan2(M22, M21) - Math.PI / 2 - rotate;
  const scaleY = Math.sqrt(M21 * M21 + M22 * M22) * Math.cos(shear);
  const translateX = M31;
  const translateY = M32;
  return {
    scaleX,
    scaleY,
    rotate,
    shear,
    translateX,
    translateY,
  };
}
