import type { LayerNode } from "@opendesign/universal";
import { useLayoutEffect, useReducer } from "react";

import { RelativeMarker } from "../../index.js";
import type { ILayerMaskProps } from "./LayerMask.js";
import { LayerMask } from "./LayerMask.js";
import { initialState, LayerMaskContext, reducer } from "./LayerMaskContext.js";

export interface ILayerMaskWrapperProps extends ILayerMaskProps {
  node: LayerNode;
}

export function LayerMaskWrapper({ onResize, node }: ILayerMaskWrapperProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stale = state.resizingStarted;

  useLayoutEffect(() => {
    const metrics = node.readMetrics();
    dispatch({
      type: "setOriginalSize",
      originalWidth: metrics.graphicalBounds[1][0],
      originalHeight: metrics.graphicalBounds[1][1],
    });
  }, [node]);

  return (
    <LayerMaskContext.Provider value={{ state, dispatch }}>
      <RelativeMarker node={node} stale={stale}>
        <LayerMask onResize={onResize} />
      </RelativeMarker>
    </LayerMaskContext.Provider>
  );
}
