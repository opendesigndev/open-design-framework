import { useContext, useEffect, useLayoutEffect, useRef } from "react";

import { useCanvasContext } from "../context.js";
import { EdgeHandle } from "./edge-handle.js";
import type { Origin } from "./layer-frame-context.js";
import { LayerFrameContext } from "./layer-frame-context.js";
import { RotateHandle } from "./rotate-handle.js";
import { ResizeHandleType } from "./use-resize.js";
import { VertexHandle } from "./vertex-handle.js";

export interface ILayerFrameProps {
  onResize?: (width: number, height: number, origin?: Origin) => void;
  onRotate?: (angle: number) => void;
}

export function LayerFrame({ onResize, onRotate }: ILayerFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvas = useCanvasContext();
  const { state, dispatch } = useContext(LayerFrameContext);

  useLayoutEffect(() => {
    dispatch({
      type: "setRef",
      containerRef,
    });
  }, [containerRef, dispatch]);

  useEffect(() => {
    if (state.resizing && containerRef.current) {
      const viewport = canvas.getViewport();
      const currentHeight =
        (containerRef.current?.offsetHeight * window.devicePixelRatio) /
        viewport.scale;
      const currentWidth =
        (containerRef.current?.offsetWidth * window.devicePixelRatio) /
        viewport.scale;
      const newHeight = currentHeight + state.deltaY;
      const newWidth = currentWidth + state.deltaX;
      // TODO: move all width/height calculations to LayerMaskContext
      if (state.shiftKey) {
        onResize?.(state.newWidth, state.newHeight, state.origin);
      } else {
        onResize?.(newWidth, newHeight, state.origin);
      }
    }

    if (state.rotating && onRotate) {
      onRotate(state.rotationRad);
    }
  }, [
    canvas,
    onResize,
    onRotate,
    state.deltaX,
    state.deltaY,
    state.newHeight,
    state.newWidth,
    state.origin,
    state.resizing,
    state.rotating,
    state.rotationRad,
    state.shiftKey,
  ]);

  return (
    <div
      style={{
        border: "1px solid red",
        visibility: state.resizing ? "hidden" : "visible",
      }}
      ref={containerRef}
    >
      <RotateHandle />
      <VertexHandle type={ResizeHandleType.TopLeft} />
      <VertexHandle type={ResizeHandleType.TopRight} />
      <VertexHandle type={ResizeHandleType.BottomRight} />
      <VertexHandle type={ResizeHandleType.BottomLeft} />
      <EdgeHandle type={ResizeHandleType.Top} />
      <EdgeHandle type={ResizeHandleType.Right} />
      <EdgeHandle type={ResizeHandleType.Bottom} />
      <EdgeHandle type={ResizeHandleType.Left} />
    </div>
  );
}
