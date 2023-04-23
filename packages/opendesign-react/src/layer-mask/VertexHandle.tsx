import { useResizable } from "./use-resize.js";

export enum VertexHandleType {
  TopLeft = "TopLeft",
  TopRight = "TopRight",
  BottomLeft = "BottomLeft",
  BottomRight = "BottomRight",
}

export interface IVertexHandleProps {
  type: VertexHandleType;
  children?: React.ReactNode;
}

export function getVertexPosition(type: VertexHandleType) {
  switch (type) {
    case VertexHandleType.TopLeft:
      return { top: -5, left: -5 };
    case VertexHandleType.TopRight:
      return { top: -5, right: -5 };
    case VertexHandleType.BottomLeft:
      return { bottom: -5, left: -5 };
    case VertexHandleType.BottomRight:
      return { bottom: -5, right: -5 };
  }
}

export function VertexHandle(props: IVertexHandleProps) {
  const { type, children } = props;
  const position = getVertexPosition(type);
  const { ref } = useResizable(type);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        ...position,
        width: 10,
        height: 10,
        border: "1px solid red",
        cursor: "pointer",
      }}
    >
      {children ? children : <div className={`vertex-handle ${type}`} />}
    </div>
  );
}
