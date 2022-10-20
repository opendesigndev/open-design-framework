import type { CreateEditorOptions, Editor, Node } from "@opendesign/universal";
import { createEditor } from "@opendesign/universal";
import { mount } from "@opendesign/universal/dom";
import { useLayoutEffect, useRef, useState } from "react";

import { todo } from "../opendesign-universal/src/internals.js";

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

/**
 * React component which displays the design on canvas <canvas>
 * @param props
 * @returns
 */
export function EditorCanvas(props: {
  editor: Editor;
  children?: React.ReactNode;
  onNodeHover?: (event: { target: Node | null }) => void;
  onViewportChange?: (event: { viewport: unknown }) => void;
  onZoom?: (event: { zoom: number }) => void;
  onClick?: (event: { target: Node | null }) => void;
}): JSX.Element {
  const { editor, ...rest } = props;
  const canvas = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => mount(editor, canvas.current!), [editor]);
  if (Object.keys(rest).length) todo("this prop is not yet supported");
  return <div ref={canvas} />;
}

export function RelativeMarker(
  props: { children: React.ReactNode } & (
    | {
        node: Node;
        inset?: number;
      }
    | {
        x: number;
        y: number;
      }
  )
): JSX.Element {
  todo();
}

export function useHoveredNode(): Node | null {
  todo();
}
