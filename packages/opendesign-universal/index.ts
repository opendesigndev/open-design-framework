type Design = { __marker: "design" };

type Page = { __marker: "page" };

type Artboard = { __marker: "artboard" };

type EditorOptions = {
  content: Design;
};

export type Editor = {
  destroy: () => void;
  // this is mostly to make react wrapper triv. using useSyncExternalStore
  subscribe: (onStoreChange: () => void) => () => void;
};

/**
 * Main entrypoint of the API. Editor creation automatically kicks of manifest
 * and ODE loading because otherwise the editor is useless.
 *
 * Loading of components, artboards and images happens on-demand so that we are
 * able to effectively prioritize important stuff.
 *
 * @param options initial options of the editor
 */
export function createEditor(options: EditorOptions): Editor {
  // ...
  return {
    destroy() {},
    subscribe: () => () => {},
  };
}

export type Renderer = { destroy: () => void; __marker: "renderer" };
export function createCanvasRenderer(
  editor: Editor,
  canvas: any /* HTMLCanvasElement|OffscreenCanvas|??? */
): Renderer {
  todo();
}

/////////
// DESIGN LOADING
// pick one of these functions
////////

/**
 * Simplest starting point, does not directly enable change saving of changes.
 * Mostly useful for read-only display. Uses `fetch` to load the design.
 *
 * @param url points either to manifest.json, or to .octopus file.
 */
export function designFromUrl(url: string): Design {
  todo();
}

/**
 * Easiest way to get started if you have live server setup, since it does not
 * require any code for saving, reloading, etc.
 *
 * @param url points to live editor server. Enables multiplayer.
 */
export function designFromLiveUrl(url: string): Design {
  // NOTES: we will probably need to figure out
  todo();
}

/**
 * Parses design and creates an in-memory representation of it. Enables local
 * editing.
 *
 * @param url points to live editor server. Enables multiplayer.
 */
export function designFromBrowserFile(file: unknown): Promise<Design> {
  // NOTE: we'll need to figure out how we want to represent save operation here
  // NOTE: file would probably be something like File, but I did not want to
  // figure out what, right now.
  todo();
}

/**
 * Parses design and creates an in-memory representation of it. Enables local
 * editing.
 *
 * @param url points to live editor server. Enables multiplayer.
 */
export function designFromNodeFile(file: unknown): Promise<Design> {
  // NOTE: we might try and somehow merge NodeFile and BrowserFile, but IDK if
  // it is even possible and this is predictable for user.
  todo();
}

export function designCreateEmpty(): Design {
  todo();
}

/////////
// OPERATIONS
// always take object they operate on as a first argument. They are not declared
// as class methods to allow for dead code elimination, since there will
// probably be tens, if not hundreds of operations.
// They change internal state.
////////

/**
 * Replaces current selection (if any) with new selection.
 *
 * @param editor
 * @param spec what to select
 */
export function setSelection(editor: Editor, spec: unknown) {
  // TODO: type of spec
  todo();
}

/**
 * Moves object relative to it's current position.
 *
 * @param editor
 * @param change how much we should move the layer
 * @param spec what to move. Defaults to selection
 */
export function moveBy(
  editor: Editor,
  change: readonly [number, number],
  spec: unknown = "selection"
) {
  // TODO: type of spec
  todo();
}

export function createPage(
  editor: Editor,
  spec: {
    name: string;
    // You usually do not have to specify this, but it is useful in tests and
    // other situations which require deterministic ids.
    id?: string;
  }
): Page {
  todo();
}

export function createArtboard(
  page: Page,
  spec: {
    name: string;
    position: readonly [number, number];
    size: readonly [number, number];
    id?: string;
  }
): Artboard {
  todo();
}

export function setName(
  object: Page | Artboard /* | ... */,
  name: string
): void {
  todo();
}

export function setViewport(
  renderer: Renderer,
  options: {
    scale: number;
    position: readonly [number, number];
  }
): void {
  todo();
}

export function getArtboard(editor: Editor, spec: { id: string }): Artboard {
  todo();
}

export function getMetrics(object: Page | Artboard /* | ... */): Promise<{
  // TODO: use same form and names as octopus
  width: number;
  height: number;
  x: number;
  y: number;
}> {
  todo();
}

/**
 * Makes it so that center of a given object is in the center of the viewport.
 *
 * If object is on invisible page, switches the page.
 *
 * @param object
 */
export function centerObject(renderer: Renderer, object: Artboard) {
  todo();
}

export function fillViewWithObject(renderer: Renderer, object: Artboard) {
  todo();
}

export function listenToEvent(
  renderer: Renderer,
  event: string,
  handler: (event: any) => void
): () => void {
  todo();
}

/////////
// MISCELLANEOUS
////////

// similar to rust's todo! macro or java's and C#'s NotImplemented Exception
// just throws an error
function todo(): never {
  throw new Error("todo");
}

// waits until all artboards, all pages, all images are loaded
export function waitForFullLoad(editor: Editor): Promise<void> {
  todo();
}

/**
 *
 * @param editor
 * @param selector
 */
export function exportImage(
  renderer: Renderer,
  selector: unknown = "selection"
): Promise<unknown /* some kind of image */> {
  todo();
}

/**
 * Destroys object. Exported for API consistency - identical to calling .destroy()
 * directly.
 * @param destroyable
 */
export function destroy(destroyable: { destroy: () => void }) {
  destroyable.destroy();
}

// NOTE: we might want to split-out things that only work in DOM into @opendesign/dom
// and node-only things to @opendesign/node. Mostly because we do not want to
// depend on users having "lib": ["DOM"] in their tsconfig to be able to use
// @opendesign/universal. Or maybe I'll be able to do some TS magic which will
// resolve to HTMLCanvasElement if DOM is used and never if not.
// If we do split, we might want to rename this package to @opendesign/core.
