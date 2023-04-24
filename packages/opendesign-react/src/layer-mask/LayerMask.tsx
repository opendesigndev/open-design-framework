import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { LayerMaskContext } from "./context.js";
import { VertexHandle, VertexHandleType } from "./VertexHandle.js";

export interface ILayerMaskProps {
  onResize?: (width: number, height: number) => void;
}

export function LayerMask({ onResize }: ILayerMaskProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { state, dispatch } = useContext(LayerMaskContext);
  const [widthRatio, setWidthRatio] = useState(1);
  const [heightRatio, setHeightRatio] = useState(1);

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
      setWidthRatio(newWidth / currentWidth);
      setHeightRatio(newHeight / currentHeight);
      onResize?.(newWidth, newHeight);
    }
  }, [onResize, state.deltaX, state.deltaY, state.resizing]);

  return (
    <div
      className="layer-mask"
      style={{
        border: "1px solid red",
        transformOrigin: `${state.originX} ${state.originY}`,
        scale: `${widthRatio} ${heightRatio}`,
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
