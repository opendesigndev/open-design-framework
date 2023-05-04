import type { LayerNode } from "@opendesign/universal";
import { useEffect, useReducer } from "react";

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

  useEffect(() => {
    const metrics = node.readMetrics();
    console.log(node.id);
    dispatch({
      type: "setOriginalSize",
      originalWidth: metrics.graphicalBounds[1][0],
      originalHeight: metrics.graphicalBounds[1][1],
    });
  }, [node, dispatch]);

  return (
    <LayerMaskContext.Provider value={{ state, dispatch }}>
      <RelativeMarker node={node} stale={stale}>
        <LayerMask onResize={onResize} />
      </RelativeMarker>
    </LayerMaskContext.Provider>
  );
}
