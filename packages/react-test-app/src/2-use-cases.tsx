import { EditorCanvas, useEditor } from "@avocode/opendesign-react";
import { Suspense } from "react";

export function UseCases() {}

function EmptyDesign() {
  const editor = useEditor({
    /* url: none, blank design by default */
    onLoad: (editor) => {
      editor.createPage();
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
      // We have a concept of "active page". Feels wrong from purity POV, but
      // 1) if user does not use multiple pages, its hidden (complexity is opt-in)
      // 2) we need to have concept active page anyway (what is displayed on canvas)
      // 3) along with 2) it makes easier to implement "create artboard" button
      // downsides:
      // a) we have to either have all "Page" functions on Editor
      // b) or using pages is harder to get right: editor.setActivePage(target).createArtboard().setActivePage(original)
      // I vote for a)
      //
      // Implementation note: if you try to invoke a method which requires a page
      // and no page is active we either select first page and use that, or if
      // there is no page, we create it.
      editor.createArtboard();
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
      editor.createArtboard().setName("Hello there");
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
    url: "/public/design.octopus",
    onLoad: (editor) => {
      editor
        .findArtboard({ name: "General Kenobi" })
        .setX(10)
        .setPosition(editor.viewport.topCenter);
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
        onViewportChange={(event) => void console.log(event)}
        editor={editor}
      />
    </Suspense>
  );
}

function PinOnPosition() {
  const editor = useEditor();

  return (
    <Suspense>
      <EditorCanvas editor={editor}>
        <RelativeMarker x={100} y={100}>
          <div style={{ width: 8, height: 8, background: "red" }}></div>
        </RelativeMarker>
      </EditorCanvas>
    </Suspense>
  );
}

// see 3-hovered-layer-overlay-alt.tsx for alternative implementation
function HoveredLayerOverlay() {
  const editor = useEditor();
  const [hoveredNode, setHoveredNode] = useState(null);

  return (
    <Suspense>
      <EditorCanvas
        editor={editor}
        onHover={(event) => {
          if (event.target.type === "LAYER") {
            setHoveredNode(event.target);
          } else {
            setHoveredNode(null);
          }
        }}
      >
        {hoveredNode ? (
          <RelativeMarker
            node={hoveredNode}
            // https://developer.mozilla.org/en-US/docs/Web/CSS/inset
            inset={-2}
          >
            <div style={{ border: "2px solid red" }} />
          </RelativeMarker>
        ) : null}
      </EditorCanvas>
    </Suspense>
  );
}

function ExportLayerToPng() {
  const editor = useEditor({
    url: "/public/design.octopus",
  });

  return (
    <Suspense>
      <EditorCanvas
        editor={editor}
        onClick={(event) => {
          event.target
            .exportBitmap({ format: "png" }) // returns Blob (supported both in node and browser)
            .then(
              (buffer) => {
                // lib: https://www.npmjs.com/package/file-saver
                // import { saveAs } from 'file-saver'
                saveAs(buffer);
              } // error handle omitted
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
    url: "/public/design.octopus",
    onLoad: (editor) => {
      // All layers in a design
      let layers = editor.findLayers();

      // All layers in active page
      layers = editor.getActivePage().findLayers();

      // All layers in specific page
      layers = editor.findPage({ id: "PAGE_ID" }).findLayers();

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
    url: "/public/design.octopus",
    onLoad: (editor) => {
      editor.findLayers({ name: "this is fine" })[0]?.select();
    },
  });

  return (
    <Suspense>
      <EditorCanvas editor={editor} />
    </Suspense>
  );
}
