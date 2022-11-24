export const headerFile = "Octopus";
export const headerContent = " is universal design format. opendesign.dev.";
const header = headerFile + headerContent;

export function isOctopusFile(buffer: ArrayBuffer) {
  if (buffer.byteLength < 134) return false;
  const view = new DataView(buffer);
  if (
    view.getUint32(0, true) !== 0x04034b50 ||
    view.getUint16(8) !== 0 ||
    view.getUint32(26) !== 0x07000000
  ) {
    return false;
  }
  for (let i = 0; i < header.length; ++i) {
    if (view.getUint8(30 + i) !== header.charCodeAt(i)) return false;
  }
  return true;
}
