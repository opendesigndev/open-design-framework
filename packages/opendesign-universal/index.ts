import { version } from "@opendesign/engine";

// Do NOT do export *
// I'd set a eslint rule for it, but it does not exist and I am not writing one
export type {
  CreateEditorOptions,
  Editor,
  EditorViewport,
} from "./src/editor.js";
export { createEditor } from "./src/editor.js";
export { importFile } from "./src/importer/importer.js";
export type { ArtboardNode } from "./src/nodes/artboard.js";
export type { DesignNode } from "./src/nodes/design.js";
export type { LayerNode } from "./src/nodes/layer.js";
export type { BaseNode, Node, NodeFilter } from "./src/nodes/node.js";
export type { PageNode } from "./src/nodes/page.js";
/**
 * Underlying Open Design Engine version used in this version of the framework.
 * Mostly useful for debugging.
 */
export const engineVersion: string = version;
