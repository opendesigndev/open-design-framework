import type { LayerNode } from "@opendesign/universal";
import { useCallback, useEffect, useLayoutEffect, useReducer } from "react";

import { RelativeMarker } from "../../index.js";
import type { ILayerFrameProps } from "./layer-frame.js";
import { LayerFrame } from "./layer-frame.js";
import {
  initialState,
  LayerFrameContext,
  reducer,
} from "./layer-frame-context.js";
import { extractAngleFromMatrix } from "./utils.js";

export interface ILayerFrameWrapperProps extends ILayerFrameProps {
  node: LayerNode;
}

export function LayerFrameWrapper({
  node,
  onResize,
  onRotate,
}: ILayerFrameWrapperProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stale = state.resizingStarted;
  // FIXME: This is for testing purposes only, remove it once PR is ready
  const handleKeyDown = useCallback(
    (evt: KeyboardEvent) => {
      const rad = 45 * (Math.PI / 180);
      if (evt.key === "a") {
        node.rotate(rad);
      }
      if (evt.key === "z") {
        node.rotate(-rad);
      }
    },
    [node],
  );

  useLayoutEffect(() => {
    const metrics = node.readMetrics();
    const angle = extractAngleFromMatrix(metrics.transformation);
    dispatch({
      type: "initLayerMask",
      rotationAngle: angle,
    });

    // FIXME: This is for testing purposes only, remove it once PR is ready
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, node]);

  useEffect(() => {
    const metrics = node.readMetrics();
    dispatch({
      type: "setOriginalSize",
      originalWidth: metrics.graphicalBounds[1][0],
      originalHeight: metrics.graphicalBounds[1][1],
    });
  }, [node, dispatch]);

  return (
    <LayerFrameContext.Provider value={{ state, dispatch }}>
      <RelativeMarker
        node={node}
        stale={stale}
        style={{
          transform: `rotate(${state.rotationAngle}deg)`,
        }}
      >
        <LayerFrame onResize={onResize} onRotate={onRotate} />
      </RelativeMarker>
    </LayerFrameContext.Provider>
  );
}
