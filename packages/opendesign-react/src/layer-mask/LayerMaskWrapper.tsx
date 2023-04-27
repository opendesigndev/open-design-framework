import type { LayerNode } from "@opendesign/universal";
import { useReducer } from "react";

import { RelativeMarker } from "../../index.js";
import { initialState, LayerMaskContext, reducer } from "./context.js";
import type { ILayerMaskProps } from "./LayerMask.js";
import { LayerMask } from "./LayerMask.js";

export interface ILayerMaskWrapperProps extends ILayerMaskProps {
  node: LayerNode;
}

export function LayerMaskWrapper({
  onResize,
  onScale,
  node,
}: ILayerMaskWrapperProps) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <LayerMaskContext.Provider value={{ state, dispatch }}>
      <RelativeMarker node={node} stale={state.resizing}>
        <LayerMask onResize={onResize} onScale={onScale} />
      </RelativeMarker>
    </LayerMaskContext.Provider>
  );
}
