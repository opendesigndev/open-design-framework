import type { CreateEditorOptions, Editor } from "@opendesign/universal";
import { createEditor } from "@opendesign/universal";
import { mount } from "@opendesign/universal/dom";
import { useLayoutEffect, useRef, useState } from "react";

export type {
  BaseNode,
  DocumentNode,
  LayerNode,
  Node,
  PageNode,
  Renderer,
} from "@opendesign/universal";
export type { CreateEditorOptions, Editor };

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
