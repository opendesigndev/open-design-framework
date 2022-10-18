import { EditorCanvas, useEditor } from "@opendesign/react";
import type { Editor } from "@opendesign/universal";
import { Suspense } from "react";

// This example is supposed to represent more realistic case of an app, where
// you potentially have your canvas in very different place, than where you have
// control elements, which affect it canvas.
//
// This is a counter-example to using ref, along with the case of not having
// Canvas at all (which for us lower priority right now).
//
// If user wants to avoid "prop drilling" they can use context instead.
export function Nested() {
  const editor = useEditor("/public/design.octopus");

  return <Inspector editor={editor} />;
}

function Inspector({ editor }: { editor: Editor }) {
  return (
    <div className="editor">
      <div className="left-sidebar">
        Layer list here, potentially also using editor.
      </div>
      <Suspense fallback={<div>Loading the design...</div>}>
        <Viewport editor={editor} />
      </Suspense>
      <RightSidebar editor={editor} />
    </div>
  );
}

function Viewport({ editor }: { editor: Editor }) {
  return <EditorCanvas editor={editor} />;
}

function RightSidebar({ editor }: { editor: Editor }) {
  const makeEdit = () => {
    // @ts-expect-error
    editor.findArtboard({ name: "Hello" }).setName("Hello World!");
  };

  return (
    <div className="right-sidebar">
      <button type="button" onClick={makeEdit}>
        Make edit
      </button>
    </div>
  );
}
