import { useContext, useEffect, useLayoutEffect, useRef } from "react";

import { LayerMaskContext } from "./context.js";
import { VertexHandle, VertexHandleType } from "./VertexHandle.js";

export interface ILayerMaskProps {
  onResize?: (width: number, height: number) => void;
  onScale: (scaleX: number, scaleY: number) => void;
}

export function LayerMask({ onResize, onScale }: ILayerMaskProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { state, dispatch } = useContext(LayerMaskContext);

  useLayoutEffect(() => {
    dispatch({
      type: "setRef",
      containerRef,
    });
  }, [containerRef, dispatch]);

  useEffect(() => {
    if (state.resizing && containerRef.current) {
      const currentHeight =
        containerRef.current?.offsetHeight * window.devicePixelRatio;
      const currentWidth =
        containerRef.current?.offsetWidth * window.devicePixelRatio;
      const newHeight = currentHeight + state.deltaY;
      const newWidth = currentWidth + state.deltaX;
      onResize?.(newWidth, newHeight);
      onScale?.(newWidth / currentWidth, newHeight / currentHeight);
    }
  }, [onResize, onScale, state.deltaX, state.deltaY, state.resizing]);

  return (
    <div
      className="layer-mask"
      style={{
        border: "1px solid red",
        visibility: state.resizing ? "hidden" : "visible",
      }}
      ref={containerRef}
    >
      <VertexHandle type={VertexHandleType.TopLeft} />
      <VertexHandle type={VertexHandleType.TopRight} />
      <VertexHandle type={VertexHandleType.BottomRight} />
      <VertexHandle type={VertexHandleType.BottomLeft} />
    </div>
  );
}
