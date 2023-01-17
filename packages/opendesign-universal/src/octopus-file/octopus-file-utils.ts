export function mergeUint8Arrays(chunks: readonly Uint8Array[]) {
  const merged = new Uint8Array(
    chunks.reduce((v, chunk) => v + chunk.length, 0),
  );
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return merged;
}
