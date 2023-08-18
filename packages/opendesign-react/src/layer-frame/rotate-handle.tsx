import { useRotate } from "./use-rotate.js";

export interface IRotateHandleProps {
  children?: React.ReactNode;
}

export function RotateHandle(props: IRotateHandleProps) {
  const { children } = props;
  const { ref } = useRotate();

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        width: 10,
        height: 10,
        border: "1px solid red",
        backgroundColor: "white",
        borderRadius: "50%",
        top: -25,
        left: "calc(50% - 5px)",
        zIndex: 1,
        cursor: "grab",
      }}
    >
      {children ? children : <div className="rotate-handle" />}
    </div>
  );
}
