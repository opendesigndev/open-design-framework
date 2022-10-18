import type {
  CreateEditorOptions,
  Editor,
} from "@avocode/opendesign-universal";
import { createEditor } from "@avocode/opendesign-universal";
import { mount } from "@avocode/opendesign-universal/dom";
import { useLayoutEffect, useRef, useState } from "react";

export type UseEditorOptions = CreateEditorOptions | string;

export function useEditor(options?: UseEditorOptions) {
  const [editor] = useState(() => {
    const ed = createEditor(
      typeof options === "object" ? options : { url: options }
    );
    return ed;
  });
  return editor;
}

export function EditorCanvas({ editor }: { editor: Editor }): JSX.Element {
  const canvas = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => mount(editor, canvas.current!), [editor]);
  return <div ref={canvas} />;
}
