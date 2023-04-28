import { ResizeHandleType, useResizable } from "./use-resize.js";

export interface IVertexHandleProps {
  type: ResizeHandleType;
  children?: React.ReactNode;
}

export function VertexHandle(props: IVertexHandleProps) {
  const { type, children } = props;
  const styles = getVertexStyles(type);
  const { ref } = useResizable(type);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        width: 10,
        height: 10,
        border: "1px solid red",
        backgroundColor: "white",
        zIndex: 2,
        ...styles,
      }}
    >
      {children ? (
        children
      ) : (
        <div className={`vertex-handle vertex-handle__${type}`} />
      )}
    </div>
  );
}

export function getVertexStyles(type: ResizeHandleType) {
  switch (type) {
    case ResizeHandleType.TopLeft:
      return { top: -5, left: -5, cursor: "nwse-resize" };
    case ResizeHandleType.TopRight:
      return { top: -5, right: -5, cursor: "nesw-resize" };
    case ResizeHandleType.BottomLeft:
      return { bottom: -5, left: -5, cursor: "nesw-resize" };
    case ResizeHandleType.BottomRight:
      return { bottom: -5, right: -5, cursor: "nwse-resize" };
  }
}
