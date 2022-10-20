import { env } from "#env";

import { __internals } from "./internals.js";
import { todo } from "./internals.js";
import type { DocumentNode } from "./nodes/document.js";
import { Document } from "./nodes/document.js";
import type { Renderer } from "./renderer.js";
import { createRenderer } from "./renderer.js";

export type CreateEditorOptions = {
  /**
   * No URL means in-memory empty design
   */
  url?: string;
  onLoad?: (editor: Editor) => void;
};

export type Editor = DocumentNode &
  Renderer & {
    /**
     * Cleans up editors resources (primarily server connection).
     */
    destroy(): void;
  };

export function createEditor(options: CreateEditorOptions): Editor {
  const canvas = env.createCanvas();
  if (options.onLoad) todo("onLoad is not supported yet");

  const document = new Document();
  const renderer = createRenderer();
  return new Proxy({ destroy() {} } as Editor, {
    get(target, prop, receiver) {
      if (prop === __internals)
        return {
          editor: document[__internals],
          renderer: renderer[__internals],
        };
      if (prop in target) return (target as any)[prop];
      if (prop in document) return (document as any)[prop];
      if (prop in renderer) return (renderer as any)[prop];
      return undefined;
    },
  });
}
