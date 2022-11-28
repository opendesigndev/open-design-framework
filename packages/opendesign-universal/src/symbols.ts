// Extracting this into separate file allows us to hot-reload even if dependency
// of editor.ts is changed.
export const canvasSymbol = Symbol("canvas");
export const engineSymbol = Symbol("engine");
