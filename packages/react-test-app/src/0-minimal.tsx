import { EditorCanvas, useEditor } from "@avocode/opendesign-react";

export function Minimal() {
  const editor = useEditor("/public/design.octopus");

  return <EditorCanvas editor={editor} />;
}
