import { EditorCanvas, useEditor } from "@opendesign/react";
import { Suspense } from "react";

export function Manual() {
  const editor = useEditor({
    onLoad(editor) {
      console.log("onLoad");
      const artboard = editor.currentPage.createArtboard();
    },
  });

  return (
    <Suspense fallback="Loading...">
      <EditorCanvas editor={editor} />
    </Suspense>
  );
}
