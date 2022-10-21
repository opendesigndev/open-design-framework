import type { Editor } from "./editor.js";
import { editorGetCanvas } from "./editor.js";

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
  const canvas: HTMLCanvasElement = editorGetCanvas(editor);

  div.appendChild(canvas);
  div.style.boxSizing = "border-box";
  canvas.style.position = "absolute";

  // Resize gets fired on zoom, which changes devicePixelRatio
  window.addEventListener("resize", listener);
  // This will get called any other time
  const observer = new ResizeObserver(listener);
  observer.observe(div);

  return () => {
    window.removeEventListener("resize", listener);
    observer.disconnect();
    div.removeChild(canvas);
  };

  function listener() {
    // TODO: maybe debounce, or memoize
    const rect = div.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.transform = `scale(${1 / window.devicePixelRatio})`;
    canvas.style.transformOrigin = "top left";
  }
}
