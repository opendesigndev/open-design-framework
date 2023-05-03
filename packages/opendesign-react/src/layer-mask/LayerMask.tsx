import { useContext, useEffect, useLayoutEffect, useRef } from "react";

import { useCanvasContext } from "../context.js";
import { EdgeHandle } from "./EdgeHandle.js";
import type { Origin } from "./LayerMaskContext.js";
import { LayerMaskContext } from "./LayerMaskContext.js";
import { ResizeHandleType } from "./use-resize.js";
import { VertexHandle } from "./VertexHandle.js";

export interface ILayerMaskProps {
  onResize?: (width: number, height: number, origin?: Origin) => void;
}

export function LayerMask({ onResize }: ILayerMaskProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvas = useCanvasContext();
  const { state, dispatch } = useContext(LayerMaskContext);

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
      onResize?.(newWidth, newHeight, state.origin);
    }
  }, [
    canvas,
    onResize,
    state.deltaX,
    state.deltaY,
    state.origin,
    state.resizing,
  ]);

  return (
    <div
      className="layer-mask"
      style={{
        border: "1px solid red",
        visibility: state.resizing ? "hidden" : "visible",
      }}
      ref={containerRef}
    >
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
