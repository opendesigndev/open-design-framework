import { useContext, useEffect, useLayoutEffect, useRef } from "react";

import { LayerMaskContext } from "./context.js";
import { VertexHandle, VertexHandleType } from "./VertexHandle.js";

export interface ILayerMaskProps {
  onResize?: (width: number, height: number) => void;
}

export function LayerMask({ onResize }: ILayerMaskProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { state, dispatch } = useContext(LayerMaskContext);
  console.log("LayerMask", state.deltaX, state.deltaY);

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
    }
  }, [onResize, state.deltaX, state.deltaY, state.resizing]);

  return (
    <div
      className="layer-mask"
      style={{
        border: "1px solid red",
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
