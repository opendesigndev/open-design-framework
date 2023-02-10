import { EditorCanvas, RelativeMarker, useEditor } from "@opendesign/react";
import type { Node } from "@opendesign/universal";
import { Suspense, useState } from "react";

export function UseCases() {}

function EmptyDesign() {
  const editor = useEditor({
    /* url: none, blank design by default */
    onLoad: (editor) => {
      editor.design.createPage();
    },
  });

  return (
    <Suspense>
      <EditorCanvas editor={editor} />
    </Suspense>
  );
}

function CreateArtboard() {
  const editor = useEditor({
    onLoad: (editor) => {
      editor.currentPage.createArtboard();
    },
  });

  return (
    <Suspense>
      <EditorCanvas editor={editor} />
    </Suspense>
  );
}

function SetArtboardName() {
  const editor = useEditor({
    onLoad: (editor) => {
      editor.currentPage.createArtboard().setName("Hello there");
    },
  });

  return (
    <Suspense>
      <EditorCanvas editor={editor} />
    </Suspense>
  );
}

function CenterArtboardFromDesign() {
  const editor = useEditor({
    design: "/public/design.octopus",
    onLoad: ({ design }) => {
      design
        // TODO: this is inefficient. Let's add something like findArtboard
        .findArtboard((n) => n.name === "General Kenobi")
        ?.setX(10)
        .setX(editor.viewport.width / 2 + editor.viewport.x);
    },
  });

  return (
    <Suspense>
      <EditorCanvas editor={editor} />
    </Suspense>
  );
}

function ZoomEvent() {
  const editor = useEditor();

  return (
    <Suspense>
      <EditorCanvas
        onZoom={(event) => void console.log(event)}
        editor={editor}
      />
    </Suspense>
  );
}

declare function saveAs(buffer: ArrayBuffer): void;
function ExportLayerToPng() {
  const editor = useEditor({
    design: "/public/design.octopus",
  });

  return (
    <Suspense>
      <EditorCanvas
        editor={editor}
        onClick={(event) => {
          event.target
            ?.exportBitmap({ format: "png" }) // returns Blob (supported both in node and browser)
            .then(
              (buffer) => {
                // lib: https://www.npmjs.com/package/file-saver
                // import { saveAs } from 'file-saver'
                saveAs(buffer);
              }, // error handle omitted
            );
          // I considered return ArrayBuffer instead of Blob, but file-saver
          // takes blob. You can always convert Blob to AB by calling .arrayBuffer()
          // https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob
          // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
          // to save in nodejs just do
          // > import fsPromises from 'node:fs/promises'
          // > await fsPromises.writeFile(path, blob.stream())
          // https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options
          // https://nodejs.org/api/buffer.html#blobstream
        }}
      />
    </Suspense>
  );
}

function ReadingLayers() {
  const editor = useEditor({
    design: "/public/design.octopus",
    onLoad: (editor) => {
      const { design } = editor;
      // All nodes in a design
      let layers = design.findAll();

      // layers (not pages nor artboards)
      layers = design.findAll(
        (node) => node.type !== "PAGE" && node.type !== "ARTBOARD",
      );

      // All layers in active page
      layers = editor.currentPage.findAll();

      // All nodes in specific page
      layers = design.findPage((page) => page.id === "PAGE_ID").findAll();

      // Naming
      // - get = reading state
      // - find = traverse document and match selector
      // meaning eg. getChildren, but findLayers({ type: 'IMAGE' })
    },
  });

  return (
    <Suspense>
      <EditorCanvas editor={editor} />
    </Suspense>
  );
}

function SelectingLayer() {
  const editor = useEditor({
    design: "/public/design.octopus",
    onLoad: (editor) => {
      editor.select(editor.design.findAll((n) => n.name === "this is fine")[0]);
    },
  });

  return (
    <Suspense>
      <EditorCanvas editor={editor} />
    </Suspense>
  );
}
