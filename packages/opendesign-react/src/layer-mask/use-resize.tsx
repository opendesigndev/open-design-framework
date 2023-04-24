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
            });
            break;
          case VertexHandleType.TopRight:
            dispatch({
              type: "resize",
              deltaX,
              deltaY: -deltaY,
            });
            break;
          case VertexHandleType.BottomLeft:
            dispatch({
              type: "resize",
              deltaX: -deltaX,
              deltaY: deltaY,
            });
            break;
          case VertexHandleType.BottomRight:
            dispatch({
              type: "resize",
              deltaX,
              deltaY,
            });
            break;
        }
      }

      const throttledHandlePointerMove = throttle(handlePointerMove, 20);

      document.addEventListener("pointermove", throttledHandlePointerMove);

      document.onpointerup = () => {
        document.removeEventListener("pointermove", throttledHandlePointerMove);
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
