import type { Editor } from "./editor.js";
import { __internals } from "./internals.js";

/**
 * Attaches editor into provided div. Only available in DOM environments.
 *
 * ## Example:
 *
 * ```ts
 * import { createEditor } from '@opendesign/universal'
 * import { mount } from '@opendesign/universal/dom'
 *
 * const editor = createEditor(/* ... *\/)
 * const cleanup = mount(editor, document.querySelector("div#canvas"))
 * // ... eventually
 * cleanup()
 * ```
 *
 * @param editor
 * @param div
 * @returns
 */
export function mount(editor: Editor, div: HTMLDivElement): () => void {
  const canvas: HTMLCanvasElement = (editor[__internals] as any).renderer
    .canvas;

  div.appendChild(canvas);

  return () => {
    div.removeChild(canvas);
  };
}
