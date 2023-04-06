import * as env from "@opendesign/env";

import type { WasmLocationSpecifier } from "../index.js";
import type { Engine } from "./engine/engine.js";
import { design_listMissingFonts } from "./engine/engine.js";
import { initEngine } from "./engine/engine.js";
import { automaticScope, createStringRef } from "./engine/memory.js";
import { todo } from "./internals.js";
import { console, performance } from "./lib.js";
import type { LayerListItem } from "./nodes/artboard.js";
import type { DesignNode } from "./nodes/design.js";
import { DesignImplementation } from "./nodes/design.js";
import type { Node } from "./nodes/node.js";
import type { PageNode } from "./nodes/page.js";
import { PageNodeImpl } from "./nodes/page.js";
import { loadFile } from "./octopus-file/load-file.js";
import { canvasSymbol, engineSymbol } from "./symbols.js";

export type EditorMediatorEvents =
  | "PASTE_SUCCESS"
  | "PASTE_FAILURE"
  | "ARTBOARD_CREATED"
  | "ARTBOARD_LOADED";

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
   *  - you can write a function which will produce the url
   *
   * The default behavior is to first try local, then if that fails use unpkg.
   *
   * If you specify this as an url, it will instead load from the url you provided.
   * There are two more special values: local and unpkg. Specify `'local'` if you
   * know local works and do not want us fetching from unpkg in case of a failure.
   * Specify `'unpkg'` in case you know local does not work and want us to directly
   * fetch from unpkg.com.
   *
   * You can also pass an array of options for which each will be tried in turn
   * and the first one that succeeds will be used.
   *
   * Considerations if you are specifying a location directly:
   *  - Make sure that you update the wasm file when you update engine.
   *  - If at any point we start using multiple wasm files (for eg. code-splitting
   *    or for importers), this option will change too. This will not be
   *    considered a semver-major change, but we will try to issue a reasonable
   *    error if that happens, since it will require changing the signature of
   *    this option.
   *  - In vite (and probably some other bundlers) local works in production but
   *    not in development, which makes it loads from unpkg by default. If you
   *    want to make sure that it never loads from external servers in production
   *    but still works on local server you can specify something like
   *    `import.meta.env.PROD ? 'local' : undefined`
   */
  wasmLocation?: WasmLocationSpecifier;
  /**
   * Specifies URL pointing to font file in .ttf format, which will be used to
   * replace missing fonts. This is so that missing fonts at least show something.
   *
   * This will likely be replaced by missing-font event, which will allow greater
   * control over how and what fonts to load.
   */
  unstable_fallbackFont?: string;
};

export type EditorViewport = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export type EditorEvents = {
  /**
   * Mirrors [HTMLMediaElement timeupdate event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/timeupdate_event).
   *
   */
  timeupdate: { currentTime: number };
  play: {};
  pause: {};
  layersList: { layers: LayerListItem | undefined };
  layersListReversed: { layers: LayerListItem | undefined };
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

  layers: LayerListItem | null;

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

  /**
   * Is false while editor is loading, true once Engine AND initial design is
   * loaded. Does not become false later - even if editor is loading something.
   */
  readonly loading: boolean;

  /**
   * Sets the current time of animation.
   *
   * @param time
   */
  setTime(time: number): void;
  /**
   * Starts playing the animation. If offset is specified, then starts playing
   * from it. Otherwise it continues from where it was last time.
   *
   * @param offset
   */
  play(offset?: number): void;
  /**
   * Stops the animation.
   */
  pause(): void;
  /**
   * Acts like a play/pause button in video players - if playing then it pauses,
   * otherwise it start playing.
   */
  togglePlaying(): void;

  /**
   * Similar to addEventListener but returns function which removes the event
   * listener.
   *
   * @param event
   * @param listener
   */
  listen<T extends keyof EditorEvents>(
    event: T,
    listener: (event: EditorEvents[T]) => void,
  ): () => void;

  /**
   * Sets a font file which will be used for a given postscript name.
   *
   * @param name is post-script name (reported in missing font event)
   * @param data contains the data of the font file
   * @param faceName specifies face within multi-face font file, otherwise can be left blank
   */
  setFont(name: string, data: Uint8Array, faceName?: string): void;
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
  #events = new Map<keyof EditorEvents, Set<(event: any) => void>>();
  [engineSymbol]: Engine | null = null;
  [canvasSymbol]: any;

  design = new DesignImplementation();
  loading = true;
  loaded: Promise<void>;
  layers: LayerListItem | null = null;

  constructor(options: CreateEditorOptions) {
    const canvas = env.createCanvas();
    this[canvasSymbol] = canvas;
    const fontData = options.unstable_fallbackFont
      ? env
          .fetch(options.unstable_fallbackFont)
          .then((v) => v.arrayBuffer())
          .then((v) => new Uint8Array(v))
      : null;
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

        options.onLoad?.(this);

        // Make sure that we have at least one artboard.
        // TODO: We should remove this once multi-artboard support is implemented
        if (!(this.currentPage as PageNodeImpl).__artboard) {
          this.currentPage.createArtboard();
        }

        // TODO: Replace this with event-based listening for missing fonts
        if (fontData) {
          try {
            const font = await fontData;
            const missingFonts = design_listMissingFonts(
              engine.ode,
              engine.design,
            );
            for (const fontName of missingFonts) {
              this.setFont(fontName, font);
            }
          } catch (e) {
            // TODO: figure out better error handling story if this if becomes
            // permanent and not just temporary workaround
            console.warn(e);
          }
        }

        this.loading = false;
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
      page = new PageNodeImpl(engine, this);
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

  #raf?: ReturnType<typeof env.requestAnimationFrame>;
  #startTime: number = 0;

  setTime(time: number) {
    this.#startTime = performance.now() - time;

    // if paused, rerender immediately
    if (!this.#raf) {
      const engine = editorGetEngine(this);
      for (const renderer of engine.renderers) {
        renderer.time = time;
      }
      engine.redraw();
      this.#dispatch("timeupdate", { currentTime: time });
    }
  }

  play(offset?: number) {
    if (offset) {
      this.#startTime = performance.now() - offset;
    } else {
      const engine = editorGetEngine(this);
      const renderer = Array.from(engine.renderers.values())[0];
      this.#startTime = performance.now() - (renderer?.time ?? 0);
    }
    if (this.#raf) {
      return;
    }
    this.#dispatch("play", {});
    this.#raf = env.requestAnimationFrame(this.#rafCallback);
  }

  #rafCallback = (currentTime: number) => {
    this.#raf = env.requestAnimationFrame(this.#rafCallback);

    const engine = editorGetEngine(this);
    const time = currentTime - this.#startTime;
    for (const renderer of engine.renderers) {
      renderer.time = time;
    }
    this.#dispatch("timeupdate", { currentTime: time });
    engine.redraw();
  };

  pause() {
    if (this.#raf) {
      // cancel further updates
      env.cancelAnimationFrame(this.#raf);
      this.#raf = undefined;
      this.#dispatch("pause", {});
    }
  }

  togglePlaying() {
    if (this.#raf) this.pause();
    else this.play();
  }

  #dispatch<T extends keyof EditorEvents>(type: T, data: EditorEvents[T]) {
    const listeners = this.#events.get(type);
    if (listeners) {
      for (const listener of listeners.values()) {
        listener(data);
      }
    }
  }

  listen<T extends keyof EditorEvents>(
    type: T,
    listener: (event: EditorEvents[T]) => void,
  ): () => void {
    // create a copy so that you can use same listener twice. IDK why you would
    // want it, but :shrug:
    const cb = (data: any) => void listener(data);
    let set = this.#events.get(type);
    if (!set) {
      set = new Set();
      this.#events.set(type, set);
    }
    set.add(cb);
    return () => {
      // typescript can't analyze this properly but if you read previous lines
      // you can see that this cant be undefined
      set!.delete(cb);
    };
  }

  setFont(postscriptName: string, data: Uint8Array, faceName?: string) {
    const engine = editorGetEngine(this);

    automaticScope((scope) => {
      const psNameRef = createStringRef(engine.ode, scope, postscriptName);
      const faceNameRef = createStringRef(engine.ode, scope, faceName ?? "");

      engine.ode.design_loadFontBytes(
        engine.design,
        psNameRef,
        engine.ode.makeMemoryBuffer(scope, data.buffer),
        faceNameRef,
      );
    });
  }

  _notify(sender: object, event: EditorMediatorEvents, data?: any): void {
    if (event === "PASTE_SUCCESS") {
      this.#handleLayersListUpdateOnPaste();
    }
  }

  #hasLayersListeners(reversed?: boolean) {
    return this.#events.has(`layersList${reversed ? "Reversed" : ""}`);
  }

  #handleLayersListUpdateOnPaste = () => {
    if (this.#hasLayersListeners()) {
      this.#dispatch("layersList", {
        layers: this.#currentPage?.findArtboard()?.getLayers(),
      });
    }

    if (this.#hasLayersListeners(true)) {
      this.#dispatch("layersListReversed", {
        layers: this.#currentPage
          ?.findArtboard()
          ?.getLayers({ naturalOrder: false }),
      });
    }
  };
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
    const error = new Error("You must wait until editor has finished loading");
    (error as any).code = "LOADING";
    throw error;
  }
  return engine;
}
