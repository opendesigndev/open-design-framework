import { env } from "#env";

import type { ToDo } from "./internals.js";
import { todo } from "./internals.js";
import type { DocumentNode } from "./nodes/document.js";
import { Document } from "./nodes/document.js";

export type CreateEditorOptions = {
  /**
   * No URL means in-memory empty design
   */
  url?: string;
};

export type Editor = {
  readonly document: DocumentNode;
  readonly renderer: ToDo;
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
    renderer: todo(),
  };
}
