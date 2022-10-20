import type { CreateEditorOptions, Editor, Node } from "@opendesign/universal";
import { createEditor } from "@opendesign/universal";
import { mount } from "@opendesign/universal/dom";
import { useLayoutEffect, useRef, useState } from "react";

import { todo } from "../opendesign-universal/src/internals.js";
import { useEditorContext } from "./src/context.js";

export { EditorProvider, useEditorContext } from "./src/context.js";

/**
 * Creates Editor object to be used. This is the main entrypoint for react apps.
 * Use {@link @opendesign/react!EditorCanvas} component to display the content.
 *
 * @param options
 * @returns
 */
export function useEditor(options?: CreateEditorOptions | string) {
  const [editor] = useState(() => {
    const ed = createEditor(
      typeof options === "object" ? options : { url: options }
    );
    return ed;
  });
  return editor;
}

export type EditorCanvasProps = {
  editor: Editor;
  children?: React.ReactNode;
  onNodeHover?: (event: { target: Node | null }) => void;
  onViewportChange?: (event: { viewport: unknown }) => void;
  onZoom?: (event: { zoom: number }) => void;
  onClick?: (event: { target: Node | null }) => void;
};

/**
 * React component which displays the design on canvas `<canvas>`. May suspend.
 * Use in conjunction with {@link @opendesign/react!useEditor}
 *
 * ## Example
 *
 * ```typescript
 *   function App() {
 *     const editor = useEditor("/public/design.octopus");
 *
 *     return (
 *       <Suspense>
 *         <EditorCanvas editor={editor} />
 *       </Suspense>
 *     );
 *   }
 * ```
 *
 * @param props
 * @returns
 */
export function EditorCanvas(props: EditorCanvasProps): JSX.Element {
  const { editor, ...rest } = props;
  const canvas = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => mount(editor, canvas.current!), [editor]);
  if (Object.keys(rest).length) todo("this prop is not yet supported");
  return <div ref={canvas} />;
}

/**
 * Renders absolutely positioned element at position of given node or at given
 * coordinates. Must be a child of {@link @opendesign/react!EditorCanvas}
 * component.
 *
 * If node is specified, then also width/height is applied and the element is
 * also hidden if it goes out of the viewport.
 *
 * @param props
 */
export function RelativeMarker(
  props:
    | {
        children: React.ReactNode;
        node: Node;
        /**
         * The element's size will be reduced by this many CSS pixels.
         * Can be negative.
         */
        inset?: number;
      }
    | {
        children: React.ReactNode;
        x: number;
        y: number;
      }
): JSX.Element {
  todo();
}

/**
 * Returns a node under the cursor.
 *
 * See {@link @opendesign/react!useEditorContext} for rules on where to use this.
 */
export function useHoveredNode(editorOverride?: Editor): Node | null {
  const editor = useEditorContext(editorOverride);
  todo();
}
