import { useReducer } from "react";

import { initialState, LayerMaskContext, reducer } from "./context.js";
import type { ILayerMaskProps } from "./LayerMask.js";
import { LayerMask } from "./LayerMask.js";

export function LayerMaskWrapper({ onResize }: ILayerMaskProps) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <LayerMaskContext.Provider value={{ state, dispatch }}>
      <LayerMask onResize={onResize} />
    </LayerMaskContext.Provider>
  );
}
