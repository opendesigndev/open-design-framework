import type { LayerNode } from "@opendesign/universal";
import { useEffect, useReducer } from "react";

import { RelativeMarker } from "../../index.js";
import type { ILayerFrameProps } from "./layer-frame.js";
import { LayerFrame } from "./layer-frame.js";
import {
  initialState,
  LayerFrameContext,
  reducer,
} from "./layer-frame-context.js";

export interface ILayerFrameWrapperProps extends ILayerFrameProps {
  node: LayerNode;
}

export function LayerFrameWrapper({ onResize, node }: ILayerFrameWrapperProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stale = state.resizingStarted;

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
      <RelativeMarker node={node} stale={stale}>
        <LayerFrame onResize={onResize} />
      </RelativeMarker>
    </LayerFrameContext.Provider>
  );
}
