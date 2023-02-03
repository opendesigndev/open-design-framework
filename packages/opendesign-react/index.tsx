import type {
  CreateEditorOptions,
  Editor,
  EditorEvents,
  Node,
} from "@opendesign/universal";
import { createEditor } from "@opendesign/universal";
import type { MountOptions, MountResult } from "@opendesign/universal/dom";
import { mount } from "@opendesign/universal/dom";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import type { LayerListItem } from "../opendesign-universal/src/nodes/artboard.js";
import { useEditorContext } from "./src/context.js";
import { usePaste } from "./src/paste.js";

export { EditorProvider, useEditorContext } from "./src/context.js";

/**
 * Creates Editor object to be used. This is the main entrypoint for react apps.
 * Use {@link @opendesign/react!EditorCanvas} component to display the content.
 *
 * @param options
 * @returns
 */
export function useEditor(options?: CreateEditorOptions | string) {
  const [error, setError] = useState<any>(null);
  if (error) throw error;
  const [editor] = useState(() => {
    const ed = createEditor(
      typeof options === "object" ? options : { design: options },
    );
    ed.loaded.catch((loadError) => void setError(loadError));
    return ed;
  });
  return editor;
}

export interface EditorCanvasProps extends MountOptions {
  editor: Editor;
  children?: React.ReactNode;
  onNodeHover?: (event: { target: Node | null }) => void;
  onViewportChange?: (event: { viewport: unknown }) => void;
  onZoom?: (event: { zoom: number }) => void;
  onPan?: (event: {}) => void;
  onClick?: (event: { target: Node | null }) => void;
  onPointerMove?: (event: { position: readonly [number, number] }) => void;
}

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
  const { editor, disableGestures, onPointerMove, ...rest } = props;
  if (editor.loading) {
    throw editor.loaded;
  }

  const canvas = useRef<HTMLDivElement>(null);
  const resultRef = useRef<MountResult | null>(null);
  useLayoutEffect(() => {
    const c = canvas.current!;
    c.style.width = "100%";
    c.style.height = "100%";
    c.style.inset = "0";
    c.style.margin = "0";
    c.style.padding = "0";
    const result = mount(editor, c, { disableGestures });
    resultRef.current = result;
    return () => {
      result.destroy();
      resultRef.current = null;
    };
  }, [disableGestures, editor]);
  if (Object.keys(rest).length) todo("this prop is not yet supported");
  return (
    <div
      onPointerMove={(event) => {
        const position = resultRef.current?.extractEventPosition(
          event.nativeEvent,
        );
        if (!position) return;
        onPointerMove?.({ position });
      }}
      ref={canvas}
    />
  );
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
      },
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

export function useReplaceStaticAnimation_unstable(animation: string) {
  const editor = useEditorContext();
  const ref = useRef("");
  useEffect(() => {
    if (ref.current !== animation) {
      ref.current = animation;
      editor.currentPage.findArtboard()?.unstable_setStaticAnimation(animation);
    }
  });
}

/**
 * similar to rust's todo! macro or java's and C#'s NotImplemented Exception
 * just throws an error
 */
function todo(what?: string): never {
  throw new Error("TODO" + (what ? ": " + what : ""));
}

/**
 * Use this function to wait until the editor is fully loaded.
 */
export function useWaitForEditorLoaded(editorOverride?: Editor): Editor {
  const editor = useEditorContext(editorOverride);
  if (editor.loading) throw editor.loaded;
  return editor;
}

/**
 * Custom hook to get list of layers in the artboard.
 * Updates the list whenever new component is pasted into the artboard.
 *
 * @param reverse if true, the list is reversed
 * @param editorOverride if specified, the editor to use
 * @returns list of layers in the artboard if any or nullish value if no artboard is present
 */
export function useLayerList(
  reverse: boolean = false,
  editorOverride?: Editor,
): LayerListItem | null | undefined {
  const editor = useWaitForEditorLoaded(editorOverride);
  const artboard = editor.currentPage.findArtboard();
  const [layers, setLayers] = useState<LayerListItem | null | undefined>();

  const updateLayers = useCallback(() => {
    setLayers(() => artboard?.getLayers(reverse));
  }, [artboard, reverse]);

  useEffect(() => {
    window.addEventListener("paste", updateLayers);

    return () => {
      window.removeEventListener("paste", updateLayers);
    };
  }, [editor, updateLayers]);

  useEffect(() => {
    updateLayers();
  }, [artboard, reverse, updateLayers]);

  return layers;
}

export { type PasteEvent, usePaste } from "./src/paste.js";
