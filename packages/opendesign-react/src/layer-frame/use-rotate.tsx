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

export function useRotate() {
  const { dispatch } = useContext(LayerFrameContext);
  const ref = useRef<HTMLDivElement>(null);
  const canvas = useCanvasContext();

  const handlePointerUp = useCallback(() => {
    dispatch({
      type: "stopRotate",
    });
  }, [dispatch]);

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      event.stopPropagation();
      event.preventDefault();
      const viewport = canvas.getViewport();
      dispatch({
        type: "startRotate",
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

        const angle = Math.atan2(deltaY, deltaX);
        const angleDeg = (angle * 180) / Math.PI;

        dispatch({
          type: "rotate",
          shiftKey: moveEvent.shiftKey,
          deltaX: deltaX,
          deltaY: deltaY,
          rotationAngle: angleDeg,
          rotationRad: angle,
        });
      }

      document.addEventListener("pointermove", handlePointerMove);

      document.onpointerup = () => {
        document.removeEventListener("pointermove", handlePointerMove);
        document.onpointerup = null;
        handlePointerUp();
      };
    },
    [canvas, dispatch, handlePointerUp],
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
