import type {
  CreateEditorOptions,
  Editor,
  LayerNode,
  Node,
} from "@opendesign/universal";
import { createEditor } from "@opendesign/universal";
import type {
  MountEventHandler,
  MountOptions,
  MountResult,
} from "@opendesign/universal/dom";
import { mount } from "@opendesign/universal/dom";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  CanvasContextProvider,
  EditorProvider,
  useCanvasContext,
  useEditorContext,
} from "./src/context.js";

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
  const { editor, disableGestures, onPointerMove, children, onClick, ...rest } =
    props;
  if (editor.loading) {
    throw editor.loaded;
  }

  const canvasParent = useRef<HTMLDivElement>(null);
  const eventTarget = useRef<HTMLDivElement>(null);
  const [canvasContext, setCanvasContext] = useState<MountResult | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<LayerNode | null>(null);

  useLayoutEffect(() => {
    const c = canvasParent.current!;
    c.style.width = "100%";
    c.style.height = "100%";
    c.style.inset = "0";
    c.style.margin = "0";
    c.style.padding = "0";
    c.style.position = "absolute";
    const result = mount(editor, c, {
      disableGestures,
      eventTarget: eventTarget.current!,
    });
    setCanvasContext(result);
    return () => {
      result.destroy();
      setCanvasContext((r) => (r === result ? null : r));
    };
  }, [disableGestures, editor]);

  useEffect(() => {
    const currentEventTarget = eventTarget.current;

    document.addEventListener("keydown", keyPressHandler);

    if (currentEventTarget) {
      currentEventTarget.addEventListener("pointerdown", pointerDownHandler);
    }

    return () => {
      document.removeEventListener("keydown", keyPressHandler);
      if (currentEventTarget) {
        currentEventTarget.removeEventListener(
          "pointerdown",
          pointerDownHandler,
        );
      }
    };

    function keyPressHandler(event: KeyboardEvent) {
      if (!selectedLayer) return;
      event.preventDefault();

      if (event.key === "Escape") {
        setSelectedLayer(null);
      }

      if (event.key === "ArrowUp") {
        selectedLayer.moveY(getDelta(event, -1));
      }

      if (event.key === "ArrowDown") {
        selectedLayer.moveY(getDelta(event, 1));
      }

      if (event.key === "ArrowLeft") {
        selectedLayer.moveX(getDelta(event, -1));
      }

      if (event.key === "ArrowRight") {
        selectedLayer.moveX(getDelta(event, 1));
      }
      canvasContext?.requestFrame();
    }

    function pointerDownHandler(event: MouseEvent | PointerEvent | WheelEvent) {
      event.preventDefault();

      const position = canvasContext?.extractEventPosition(event);
      if (!position) return;
      const id = editor.currentPage.findArtboard()?.identifyLayer(position);
      const layer = id
        ? editor.currentPage.findArtboard()?.getLayerById(id) ?? null
        : null;

      onClick?.({
        target: layer,
      });

      let layerX = 0;
      let layerY = 0;
      let cursorOffestX = 0;
      let cursorOffestY = 0;

      setSelectedLayer(layer);

      if (layer) {
        const layerTransformation = layer.readMetrics().transformation;
        layerX = layerTransformation[4];
        layerY = layerTransformation[5];
        cursorOffestX = position[0] - layerX;
        cursorOffestY = position[1] - layerY;
      }

      function onPointerMove(moveEvent: PointerEvent): void {
        const movePosition = canvasContext?.extractEventPosition(moveEvent);

        if (!layer || !movePosition) return;

        const moveX = movePosition[0] - cursorOffestX;
        const moveY = movePosition[1] - cursorOffestY;
        layer?.setPosition([moveX, moveY]);
        canvasContext?.requestFrame();
      }

      document.addEventListener("pointermove", onPointerMove);
      document.onpointerleave = () => {
        document.removeEventListener("pointermove", onPointerMove);
        document.onpointerleave = null;
      };
      document.onpointerup = () => {
        document.removeEventListener("pointermove", onPointerMove);
        document.onpointerup = null;
      };
    }
  }, [canvasContext, editor.currentPage, onClick, selectedLayer]);

  if (Object.keys(rest).length) todo("this prop is not yet supported");

  return (
    <EditorProvider editor={editor}>
      <CanvasContextProvider value={canvasContext}>
        <div
          onPointerMove={(event) => {
            const position = canvasContext?.extractEventPosition(
              event.nativeEvent,
            );
            if (!position) return;
            onPointerMove?.({ position });
          }}
          style={{
            width: "100%",
            height: "100%",
            inset: 0,
            margin: 0,
            padding: 0,
            boxSizing: "border-box",
            position: "relative",
          }}
          ref={eventTarget}
        >
          <div ref={canvasParent} />
          <div style={{ position: "absolute", inset: 0, overflow: "clip" }}>
            {children}
          </div>
        </div>
      </CanvasContextProvider>
    </EditorProvider>
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
  props: {
    children: React.ReactNode;
    node: LayerNode; // TODO: <- change to Node
    /**
     * The element's size will be reduced by this many CSS pixels.
     * Can be negative.
     */
    inset?: number;
  } /* TODO:
    | {
        children: React.ReactNode;
        x: number;
        y: number;
      } */,
): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const canvas = useCanvasContext();

  const handler: MountEventHandler<"viewportChange"> = useCallback(
    ({ viewport }) => {
      const div = ref.current!;

      if (!div) return;

      const metrics = props.node.readMetrics();

      div.style.width =
        (metrics.graphicalBounds[1][0] - metrics.graphicalBounds[0][0]) *
          (viewport.scale / window.devicePixelRatio) -
        (props.inset ?? 0) * 2 +
        "px";
      div.style.height =
        (metrics.graphicalBounds[1][1] - metrics.graphicalBounds[0][1]) *
          (viewport.scale / window.devicePixelRatio) -
        (props.inset ?? 0) * 2 +
        "px";
      div.style.left =
        (metrics.transformation[4] +
          metrics.graphicalBounds[0][0] -
          viewport.offset[0]) *
          (viewport.scale / window.devicePixelRatio) -
        (props.inset ?? 0) +
        "px";
      div.style.top =
        (metrics.transformation[5] +
          metrics.graphicalBounds[0][1] -
          viewport.offset[1]) *
          (viewport.scale / window.devicePixelRatio) -
        (props.inset ?? 0) +
        "px";

      div.style.position = "absolute";
    },
    [props.inset, props.node],
  );
  useLayoutEffect(() => {
    const div = ref.current;
    if (!div) return;

    handler({ viewport: canvas.getViewport() });
    return canvas.subscribe("viewportChange", handler);
  }, [canvas, handler, props.inset, props.node]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        display: "grid",
      }}
    >
      {props.children}
    </div>
  );
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
 * Calculates delta based on modifier keys.
 * @param event
 * @param delta
 * @returns delta in pixels
 */
function getDelta(event: KeyboardEvent, delta: number): number {
  if (event.shiftKey) {
    return delta * 10;
  }
  return delta;
}

export { type PasteEvent, usePaste } from "./src/paste.js";
export { useLayerList } from "./src/use-layer-list.js";
