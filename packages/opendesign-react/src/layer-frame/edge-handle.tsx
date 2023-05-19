import { ResizeHandleType, useResizable } from "./use-resize.js";

export interface IEdgeHandleProps {
  type: ResizeHandleType;
  children?: React.ReactNode;
}

export function EdgeHandle(props: IEdgeHandleProps) {
  const { type, children } = props;
  const styles = getEdgeStyles(type);
  const { ref } = useResizable(type);

  return (
    <div
      ref={ref}
      style={{
        ...styles,
        position: "absolute",
        zIndex: 1,
      }}
    >
      {children}
    </div>
  );
}

export function getEdgeStyles(type: ResizeHandleType) {
  switch (type) {
    case ResizeHandleType.Top:
      return { top: -5, height: 10, width: "100%", cursor: "ns-resize" };
    case ResizeHandleType.Right:
      return { right: -5, width: 10, height: "100%", cursor: "ew-resize" };
    case ResizeHandleType.Bottom:
      return { bottom: -5, height: 10, width: "100%", cursor: "ns-resize" };
    case ResizeHandleType.Left:
      return { left: -5, width: 10, height: "100%", cursor: "ew-resize" };
  }
}
