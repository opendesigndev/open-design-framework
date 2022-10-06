type Design = {};

type RecursiveArray<T> = T | readonly T[];

type EditorOptions = {
  content: Design;
  plugins?: RecursiveArray<Plugin>;
};

type PluginRegistration = {
  unregister: () => void;
};

export type Editor = {
  // this is mostly to make react wrapper triv. using useSyncExternalStore
  subscribe: (onStoreChange: () => void) => () => void;

  // plugins, see relevant section below
  registerPlugin: (plugin: Plugin) => PluginRegistration;
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
    subscribe: () => () => {},
    registerPlugin(plugin: Plugin) {
      return {
        unregister() {},
      };
    },
  };
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

/////////
// PLUGINS
// They listen for events and implement behavior. You usually set them up at the
// start and then forget about them.
////////

/**
 * Vision here is to use plugin API similar to https://rollupjs.org/guide/en/#plugins-overview
 * with the big difference that we'll allow plugins to attach, detach and attach
 * again to allow for dynamic changes in configuration. There might be some
 * plugins which do not allow this, but vast majority should have no problem.
 * I used this API for some things and it is very ergonomic, allows good typescript
 * typing. Also, the reason I did not use EventTarget is that this should be much
 * faster than dispatching real heavyweight DOM events.
 *
 * Note on stability: we can consider Plugin API unstable and the rest stable.
 * At least at first. This would mean that if you are not writing plugins you
 * can count on the API, but if you are, then you would have to update the plugin
 * from time to time. But the plugins themselves should not be too big, so this
 * would be mostly self-contained.
 *
 * Most functionality should be implemented in plugin and editor should be just
 * wiring it together.
 */
export type Plugin = {
  // required, so that we can emit reasonable errors and so that we can guarantee
  // that same plugin is not used multiple times.
  // recommended values:
  // - if you are npm package implementing single plugin: package-name
  // - if you are npm package implementing multiple plugins: package-name/plugin-name
  // - if you are an application: application-name or application-name/plugin-name
  name: string;
  attached?: (editor: Editor) => void;
  detached?: () => void;
  engineLoaded?: (ode: unknown) => void;

  // Editor will emit error if this plugin is enabled before its dependencies.
  // Or if dependencies are disabled before this plugin.
  dependsOn?: () => readonly string[];
  // many, many, many more hooks
};

/**
 * Deals with rendering the design into canvas
 */
export function canvasPlugin(target: unknown /* HTMLCanvasElement */): Plugin {
  todo();
}

/**
 * Enables user to select stuff on canvas using mouse/touch. Requires canvasPlugin.
 */
export function pointerSelectionPlugin(): Plugin {
  todo();
}

/**
 * Saves changes you made to the design and allows you to roll them back/forward.
 */
export function undoRedoPlugin(): Plugin {
  todo();
}

/**
 * Attaches event listeners to DOM and triggers various actions. Requires canvasPlugin.
 */
export function shortcutPlugin(): Plugin {
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
  editor: Editor,
  selector: unknown = "selection"
): Promise<unknown /* some kind of image */> {
  todo();
}

// NOTE: we might want to split-out things that only work in DOM into @opendesign/dom
// and node-only things to @opendesign/node. Mostly because we do not want to
// depend on users having "lib": ["DOM"] in their tsconfig to be able to use
// @opendesign/universal. Or maybe I'll be able to do some TS magic which will
// resolve to HTMLCanvasElement if DOM is used and never if not.
// If we do split, we might want to rename this package to @opendesign/core.
