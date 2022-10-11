import { EditorCanvas, useEditor } from "@avocode/opendesign-react";
import { Suspense } from "react";

export function Minimal() {
  const editor = useEditor("/public/design.octopus");

  return (
    <Suspense>
      <EditorCanvas editor={editor} />
    </Suspense>
  );
}
