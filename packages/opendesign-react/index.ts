import { useState } from "react";
import {
  createEditor,
  designFromUrl,
  Editor,
} from "@avocode/opendesign-universal";

// NOTE: I did not spend too much time thinking about editor API

export function useEditor(url: string) {
  const [editor] = useState(() =>
    createEditor({ content: designFromUrl(url) })
  );
  return editor;
}

export function EditorCanvas({ editor }: { editor: Editor }): JSX.Element {
  todo();
}

function todo(): never {
  throw new Error("todo");
}
