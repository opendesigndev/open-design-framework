import { env } from "#env";

import { createInternals } from "./internals.js";
import { todo } from "./internals.js";
import type { DesignNode } from "./nodes/design.js";
import { DesignImplementation } from "./nodes/design.js";

export type CreateEditorOptions = {
  /**
   * No URL means in-memory empty design
   */
  url?: string;
  onLoad?: (editor: Editor) => void;
};

export const editorInternals = createInternals<Editor, { canvas: any }>();

export type Editor = {
  design: DesignNode;
  readonly viewport: { x: number; y: number; width: number; height: number };
  /**
   * Cleans up editors resources (primarily server connection).
   */
  destroy(): void;
};

/**
 * Main entrypoint of '@opendesign/universal' module. Contains graphics context,
 * design data etc. Automatically starts loading the wasm engine.
 *
 * @param options
 * @returns Editor
 */
export function createEditor(options: CreateEditorOptions): Editor {
  if (options.onLoad) todo("onLoad is not supported yet");

  return editorInternals.create(
    {
      design: new DesignImplementation(),
      get viewport() {
        return todo();
      },
      destroy() {
        todo();
      },
    },
    { canvas: env.createCanvas() }
  );
}
