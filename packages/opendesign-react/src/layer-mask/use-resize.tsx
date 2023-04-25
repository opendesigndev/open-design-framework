import { useCallback, useContext, useLayoutEffect, useRef } from "react";

import { throttle } from "../throttle.js";
import { LayerMaskContext } from "./context.js";
import { VertexHandleType } from "./VertexHandle.js";

export function useResizable(type: VertexHandleType) {
  const { dispatch } = useContext(LayerMaskContext);
  const ref = useRef<HTMLDivElement>(null);

  const handlePointerUp = useCallback(() => {
    dispatch({
      type: "stopResize",
    });
  }, [dispatch]);

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      event.stopPropagation();
      const handle = event.target;
      event.preventDefault();
      dispatch({
        type: "startResize",
        resizingHandle: handle,
        startX: event.pageX,
        startY: event.pageY,
      });

      function handlePointerMove(moveEvent: PointerEvent) {
        const deltaX =
          (moveEvent.pageX - event.pageX) * (1 / window.devicePixelRatio);
        const deltaY =
          (moveEvent.pageY - event.pageY) * (1 / window.devicePixelRatio);

        switch (type) {
          case VertexHandleType.TopLeft:
            dispatch({
              type: "resize",
              deltaX: -deltaX,
              deltaY: -deltaY,
              originX: "right",
              originY: "bottom",
            });
            break;
          case VertexHandleType.TopRight:
            dispatch({
              type: "resize",
              deltaX,
              deltaY: -deltaY,
              originX: "left",
              originY: "bottom",
            });
            break;
          case VertexHandleType.BottomLeft:
            dispatch({
              type: "resize",
              deltaX: -deltaX,
              deltaY: deltaY,
              originX: "right",
              originY: "top",
            });
            break;
          case VertexHandleType.BottomRight:
            dispatch({
              type: "resize",
              deltaX,
              deltaY,
              originX: "left",
              originY: "top",
            });
            break;
        }
      }

      const throttledHandlePointerMove = throttle(handlePointerMove, 60);

      document.addEventListener("pointermove", handlePointerMove);

      document.onpointerup = () => {
        document.removeEventListener("pointermove", handlePointerMove);
        document.onpointerup = null;
        handlePointerUp();
      };
    },
    [dispatch, handlePointerUp, type],
  );

  useLayoutEffect(() => {
    const element = ref.current;
    if (element) {
      element.onpointerdown = handlePointerDown;
    }

    return () => {
      if (element) {
        element.onpointerdown = null;
      }
    };
  }, [handlePointerDown]);

  return {
    ref,
  };
}
