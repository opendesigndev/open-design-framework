import { env } from "#env";

import type { DocumentNode } from "./nodes/document.js";
import { Document } from "./nodes/document.js";
import type { Renderer } from "./renderer.js";
import { createRenderer } from "./renderer.js";

export type CreateEditorOptions = {
  /**
   * No URL means in-memory empty design
   */
  url?: string;
};

export type Editor = {
  readonly document: DocumentNode;
  readonly renderer: Renderer;
  /**
   * Cleans up editors resources (primarily server connection).
   */
  destroy(): void;
};

export function createEditor(options: CreateEditorOptions): Editor {
  const canvas = env.createCanvas();
  return {
    destroy() {},
    document: new Document(),
    renderer: createRenderer(),
  };
}
