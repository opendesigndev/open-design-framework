import { EditorCanvas, useEditor } from "@opendesign/react";
import { Suspense } from "react";

export function Minimal() {
  const editor = useEditor("/static/file.octopus");

  return (
    <Suspense>
      <EditorCanvas editor={editor} />
    </Suspense>
  );
}
