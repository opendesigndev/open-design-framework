import { version } from "@opendesign/engine";

// Do NOT do export *
// I'd set a eslint rule for it, but it does not exist and I am not writing one
export type {
  CreateEditorOptions,
  Editor,
  EditorViewport,
} from "./src/editor.js";
export type { EditorEvents } from "./src/editor.js";
export { createEditor } from "./src/editor.js";
export type {
  WasmLocationSpecifier,
  WasmLocationSpecifierSingle,
} from "./src/engine/engine-wrapper.js";
export type { ArtboardNode } from "./src/nodes/artboard.js";
export type { DesignNode } from "./src/nodes/design.js";
export type { LayerNode } from "./src/nodes/layer.js";
export type { BaseNode, Node, NodeFilter } from "./src/nodes/node.js";
export type { PageNode } from "./src/nodes/page.js";
export { isOptimizedOctopusFile } from "./src/octopus-file/detect.js";
export { importFile } from "./src/octopus-file/importer.js";
export type {
  OctopusFile,
  OctopusManifest,
} from "./src/octopus-file/octopus-file.js";
export { readOctopusFile } from "./src/octopus-file/read-octopus-file.js";
export { importFromClipboardData } from "./src/paste/import-from-clipboard-data.js";
/**
 * Underlying Open Design Engine version used in this version of the framework.
 * Mostly useful for debugging.
 */
export const engineVersion: string = version;
