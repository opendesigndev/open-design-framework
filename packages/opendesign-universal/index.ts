// Do NOT do export *
// I'd set a eslint rule for it, but it does not exist and I am not writing one
export type { CreateEditorOptions, Editor } from "./src/editor.js";
export { createEditor } from "./src/editor.js";
export type { Node } from "./src/nodes/node.js";
