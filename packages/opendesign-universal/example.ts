// NOTE: this could be converted to a bunch of named imports
// in vscode you can ctrl+. (cmd+. on macos) and run the refactoring
// Named imports look cleaner at call-site, this is better for autocomplete.
// They are identical at runtime.
import * as odf from "./index.js";
declare var document: any;

// stand-in for code that is not important for the example
function magic(...args: unknown[]): any {
  throw "";
}

const sendToMixpanel = magic; // this would actually be import

/// Use-cases, implemented in js without frameworks. This is the low level api
/// everything else is built on.

// Create a blank design
let editor = odf.createEditor({
  content: odf.designCreateEmpty(),
});
let renderer = odf.createCanvasRenderer(
  editor,
  document.querySelector("canvas")
);

// Create page
let page = odf.createPage(editor, { name: "Page 1" });

// Create artboard
let artboard = odf.createArtboard(page, {
  name: "Artboard",
  // TODO: align those names with octopus specs
  position: [10, 10],
  size: [1920, 1080],
});

// Edit artboard name
odf.setName(artboard, "Stuff and things");

// cleanup use-case 1
renderer.destroy(); // technically not necessary, implied by editor.destroy
editor.destroy();

// Open a design
editor = odf.createEditor({
  content: odf.designFromUrl("/public/file/manifest.json"),
});
renderer = odf.createCanvasRenderer(editor, document.querySelector("canvas"));

// center a specific artboard, manual calculation:
artboard = odf.getArtboard(editor, { id: "da-c0ffee" });
let bounds = await odf.getMetrics(artboard);
odf.setViewport(renderer, magic(renderer, bounds));

// center a specific artboard, using utility function
artboard = odf.getArtboard(editor, { id: "da-c0ffee" });
odf.centerObject(renderer, artboard);

// get one zoom event
let unsubscribe = odf.listenToEvent(renderer, "zoom", (event) => {
  sendToMixpanel(event);
  unsubscribe();
});

// zoom to specific artboard
odf.fillViewWithObject(renderer, artboard);

// select a layer
odf.setSelection(editor, { artboard: "da-c0ffee" });

// export image of selected layer
odf.exportImage(renderer);

// cleanup vol 2
// destroy function is exported for API consistency
odf.destroy(editor);
