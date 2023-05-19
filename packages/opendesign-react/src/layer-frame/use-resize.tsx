import { useCallback, useContext, useLayoutEffect, useRef } from "react";

import { useCanvasContext } from "../context.js";
import { LayerFrameContext } from "./layer-frame-context.js";

export enum ResizeHandleType {
  TopLeft = "top-left",
  TopRight = "top-right",
  BottomLeft = "bottom-left",
  BottomRight = "bottom-right",
  Top = "top",
  Right = "right",
  Bottom = "bottom",
  Left = "left",
}

export function useResizable(type: ResizeHandleType) {
  const { dispatch } = useContext(LayerFrameContext);
  const ref = useRef<HTMLDivElement>(null);
  const canvas = useCanvasContext();

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
      const viewport = canvas.getViewport();
      dispatch({
        type: "startResize",
        resizingHandle: handle,
        startX: event.pageX,
        startY: event.pageY,
      });

      function handlePointerMove(moveEvent: PointerEvent) {
        const deltaX =
          (moveEvent.pageX - event.pageX) *
          window.devicePixelRatio *
          (1 / viewport.scale);
        const deltaY =
          (moveEvent.pageY - event.pageY) *
          window.devicePixelRatio *
          (1 / viewport.scale);

        switch (type) {
          case ResizeHandleType.TopLeft:
            dispatch({
              type: "resize",
              shiftKey: moveEvent.shiftKey,
              altKey: moveEvent.altKey,
              deltaX: -deltaX,
              deltaY: -deltaY,
              originX: "right",
              originY: "bottom",
            });
            break;
          case ResizeHandleType.TopRight:
            dispatch({
              type: "resize",
              shiftKey: moveEvent.shiftKey,
              altKey: moveEvent.altKey,
              deltaX,
              deltaY: -deltaY,
              originX: "left",
              originY: "bottom",
            });
            break;
          case ResizeHandleType.BottomLeft:
            dispatch({
              type: "resize",
              shiftKey: moveEvent.shiftKey,
              altKey: moveEvent.altKey,
              deltaX: -deltaX,
              deltaY: deltaY,
              originX: "right",
              originY: "top",
            });
            break;
          case ResizeHandleType.BottomRight:
            dispatch({
              type: "resize",
              shiftKey: moveEvent.shiftKey,
              altKey: moveEvent.altKey,
              deltaX,
              deltaY,
              originX: "left",
              originY: "top",
            });
            break;
          case ResizeHandleType.Top:
            dispatch({
              type: "resize",
              shiftKey: moveEvent.shiftKey,
              altKey: moveEvent.altKey,
              deltaX: 0,
              deltaY: -deltaY,
              originX: "center",
              originY: "bottom",
            });
            break;
          case ResizeHandleType.Right:
            dispatch({
              type: "resize",
              shiftKey: moveEvent.shiftKey,
              altKey: moveEvent.altKey,
              deltaX,
              deltaY: 0,
              originX: "left",
              originY: "center",
            });
            break;
          case ResizeHandleType.Bottom:
            dispatch({
              type: "resize",
              shiftKey: moveEvent.shiftKey,
              altKey: moveEvent.altKey,
              deltaX: 0,
              deltaY,
              originX: "center",
              originY: "top",
            });
            break;
          case ResizeHandleType.Left:
            dispatch({
              type: "resize",
              shiftKey: moveEvent.shiftKey,
              altKey: moveEvent.altKey,
              deltaX: -deltaX,
              deltaY: 0,
              originX: "right",
              originY: "center",
            });
            break;
        }
      }

      document.addEventListener("pointermove", handlePointerMove);

      document.onpointerup = () => {
        document.removeEventListener("pointermove", handlePointerMove);
        document.onpointerup = null;
        handlePointerUp();
      };
    },
    [canvas, dispatch, handlePointerUp, type],
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
