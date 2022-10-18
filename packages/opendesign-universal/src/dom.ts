import type { Editor } from "./editor.js";
import { __internals } from "./internals.js";

export function mount(editor: Editor, div: HTMLDivElement): () => void {
  const canvas: HTMLCanvasElement = (editor.renderer[__internals] as any)
    .canvas;

  div.appendChild(canvas);

  return () => {
    div.removeChild(canvas);
  };
}
