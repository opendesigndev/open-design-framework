import * as env from "@opendesign/env";

import type { Engine } from "./engine/engine.js";
import { initEngine } from "./engine/engine.js";
import { queueMicrotask } from "./internals.js";
import { todo } from "./internals.js";
import type { DesignNode } from "./nodes/design.js";
import { DesignImplementation } from "./nodes/design.js";
import type { Node } from "./nodes/node.js";
import type { PageNode } from "./nodes/page.js";
import { PageNodeImpl } from "./nodes/page.js";
import { loadFile } from "./octopus-file/load-file.js";
import { canvasSymbol, engineSymbol } from "./symbols.js";

export type CreateEditorOptions = {
  /**
   * No design means in-memory empty design
   *
   * - `string` - url pointing to .octopus, which will be fetched
   * - `Uint8Array` - contents of octopus file
   */
  design?: string | Uint8Array;
  /**
   * Specifies component to be loaded - if design has more components, then this
   * limits loaded components to only this.
   *
   * _Currently,_ if this is not specified (or `null`), only a first component
   * is loaded. In the future, we plan to add multi-component support and then
   * we will load first page.
   */
  componentId?: string | null;
  onLoad?: (editor: Editor) => void;
  /**
   * Specifies where to find Engine's wasm file. Since there is no good, interoperable,
   * cross-bundler way to load asset from an npm package, we unfortunately have to
   * leave it up to you.
   *
   * There are a few ways we can load the wasm:
   *  - locally using new URL(..., import.meta.url) pattern
   *  - from unpkg
   *  - from any url you specify
   *
   * The default behavior is to first try local, then if that fails use unpkg.
   *
   * If you specify this as an url, it will instead load from the url you provided.
   * There are two more special values: local and unpkg. Specify `'local'` if you
   * know local works and do not want us fetching from unpkg in case of a failure.
   * Specify `'unpkg'` in case you know local does not work and want us to directly
   * fetch from unpkg.com.
   *
   * Considerations if you are specifying a location directly:
   *  - Make sure that you update the wasm file when you update engine.
   *  - If at any point we start using multiple wasm files (for eg. code-splitting
   *    or for importers), this option will change too. This will not be
   *    considered a semver-major change, but we will try to issue a reasonable
   *    error if that happens, since it will require changing the signature of
   *    this option.
   *  - In vite (and probably some other bundlers) you can use
   *    `new URL('@opendesign/engine/ode.wasm', import.meta.url).href` as a value
   *    for this option.
   */
  wasmLocation?: "unpkg" | "local" | string;
};

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

/**
 * @internal
 */
export class EditorImplementation implements Editor {
  #currentPage: null | PageNode = null;
  [engineSymbol]: Engine | null = null;
  [canvasSymbol]: any;

  design = new DesignImplementation();
  loaded: Promise<void>;

  constructor(options: CreateEditorOptions) {
    const canvas = env.createCanvas();
    this[canvasSymbol] = canvas;
    this.loaded = initEngine(canvas, options.wasmLocation).then(
      async (engine) => {
        if (options.design) {
          let data: Uint8Array;
          if (typeof options.design === "string") {
            const response = await env.fetch(options.design, {
              credentials: "same-origin",
            });
            data = new Uint8Array(await response.arrayBuffer());
          } else {
            data = options.design;
          }
          this[engineSymbol] = engine;
          const loaded = loadFile(
            data,
            engine,
            this,
            options.componentId ?? undefined,
          );
          await loaded.loadImages();
        } else {
          this[engineSymbol] = engine;
        }

        // Make sure that we have at least one artboard.
        // We should remove this once multi-artboard support is implemented
        if (!(this.currentPage as PageNodeImpl).__artboard) {
          this.currentPage.createArtboard();
        }
        queueMicrotask(() => {
          options.onLoad?.(this);
        });
      },
    );
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
