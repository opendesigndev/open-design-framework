import { env } from "#env";

import type { Engine } from "./engine/engine.js";
import { initEngine } from "./engine/engine.js";
import { createInternals, queueMicrotask } from "./internals.js";
import { todo } from "./internals.js";
import type { DesignNode } from "./nodes/design.js";
import { DesignImplementation } from "./nodes/design.js";
import type { Node } from "./nodes/node.js";
import type { PageNode } from "./nodes/page.js";
import { PageNodeImpl } from "./nodes/page.js";
import { loadFile } from "./octopus-file/load-file.js";

export type CreateEditorOptions = {
  /**
   * No URL means in-memory empty design
   */
  url?: string;
  onLoad?: (editor: Editor) => void;
};

export const editorInternals = createInternals<Editor, { canvas: any }>();

export type EditorViewport = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/**
 * Editor is the main object users interact with. It corresponds to one design
 * and up to one viewport (zero or one).
 *
 * Create it using {@link @opendesign/universal!createEditor}, or if you are in
 * react using {@link @opendesign/react!useEditor}.
 *
 * Editor vs Design: if something is per-user in multiplayer editing, then it
 * is on editor. Otherwise it is on design.
 */
export interface Editor {
  /**
   * Contains the design being edited.
   */
  readonly design: DesignNode;
  /**
   * Contains information about currently visible portion of the design.
   * Available even if design is not actually rendered.
   */
  readonly viewport: EditorViewport;
  /**
   * Cleans up editors resources (primarily server connection).
   */
  destroy(): void;

  /**
   *
   */
  readonly currentPage: PageNode;

  /**
   * Marks node(s) as selected, deselecting any other currently-selected node.
   */
  select(node: undefined | null | Node | readonly Node[]): void;

  /**
   * Contains list of selected nodes.
   */
  readonly selected: readonly Node[];

  /**
   * Resolves when editor is loaded (engine + design).
   */
  readonly loaded: Promise<void>;
}

/**
 * Main entrypoint of '@opendesign/universal' module. Contains graphics context,
 * design data etc. Automatically starts loading the wasm engine.
 *
 * ## Example
 *
 * ```typescript
 * import { createEditor } from '@opendesign/universal'
 * const editor = createEditor()
 * ```
 *
 * @param options
 * @returns Editor
 */
export function createEditor(options: CreateEditorOptions = {}): Editor {
  const editor = new EditorImplementation(options);

  return editor;
}

const canvasSymbol = Symbol();
const engineSymbol = Symbol();
/**
 * @internal
 */
class EditorImplementation implements Editor {
  #currentPage: null | PageNode = null;
  [engineSymbol]: Engine | null = null;
  [canvasSymbol]: any;

  design = new DesignImplementation();
  loaded: Promise<void>;

  constructor(options: CreateEditorOptions) {
    const canvas = env.createCanvas();
    this[canvasSymbol] = canvas;
    this.loaded = initEngine(canvas).then(async (engine) => {
      if (options.url) {
        const response = await env.fetch(options.url);
        loadFile(new Uint8Array(await response.arrayBuffer()), engine);
      }

      this[engineSymbol] = engine;
      // Make sure that we have at least one artboard.
      // We should remove this once multi-artboard support is implemented
      if (!(this.currentPage as PageNodeImpl).__artboard) {
        this.currentPage.createArtboard();
      }
      queueMicrotask(() => {
        options.onLoad?.(this);
      });
    });
  }

  get viewport() {
    return todo();
  }
  destroy() {
    todo();
  }

  get currentPage(): PageNode {
    const engine = editorGetEngine(this);

    let page = this.#currentPage;
    if (!page) {
      page = new PageNodeImpl(engine);
      this.#currentPage = page;
    }
    return page;
  }

  select() {
    todo();
  }

  get selected() {
    return todo();
  }
}

/**
 * @internal
 */
export function editorGetCanvas(editor: Editor) {
  return (editor as EditorImplementation)[canvasSymbol];
}
/**
 * @internal
 */
export function editorGetEngine(editor: Editor): Engine {
  const engine = (editor as EditorImplementation)[engineSymbol];
  if (!engine) {
    throw new Error("You must wait until editor has finished loading");
  }
  return engine;
}
