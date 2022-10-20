import { env } from "#env";

import { __internals } from "./internals.js";
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

export type Editor = {
  [__internals]: unknown;
  design: DesignNode;
  readonly viewport: { x: number; y: number; width: number; height: number };
  /**
   * Cleans up editors resources (primarily server connection).
   */
  destroy(): void;
};

export function createEditor(options: CreateEditorOptions): Editor {
  if (options.onLoad) todo("onLoad is not supported yet");

  return {
    [__internals]: { canvas: env.createCanvas() },
    design: new DesignImplementation(),
    get viewport() {
      return todo();
    },
    destroy() {
      todo();
    },
  };
}
