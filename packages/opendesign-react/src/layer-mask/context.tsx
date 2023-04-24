import { createContext } from "react";

export type LayerMaskState = {
  containerRef: React.RefObject<HTMLDivElement> | null;
  resizingHandle: EventTarget | null;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  originX: LayerOriginPositions;
  originY: LayerOriginPositions;
  resizing: boolean;
};

export type LayerOriginPositions =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "center";

export type LayerMaskAction =
  | {
      type: "setRef";
      containerRef: React.RefObject<HTMLDivElement>;
    }
  | {
      type: "startResize";
      resizingHandle: EventTarget | null;
      startX: number;
      startY: number;
    }
  | {
      type: "resize";
      deltaX: number;
      deltaY: number;
      originX: LayerOriginPositions;
      originY: LayerOriginPositions;
    }
  | {
      type: "stopResize";
    };

export const initialState: LayerMaskState = {
  containerRef: null,
  resizingHandle: null,
  startX: 0,
  startY: 0,
  deltaX: 0,
  deltaY: 0,
  originX: "center",
  originY: "center",
  resizing: false,
};

export function reducer(
  state: LayerMaskState,
  action: LayerMaskAction,
): LayerMaskState {
  switch (action.type) {
    case "setRef":
      return {
        ...state,
        containerRef: action.containerRef,
      };
    case "startResize":
      return {
        ...state,
        resizingHandle: action.resizingHandle,
        startX: action.startX,
        startY: action.startY,
      };
    case "resize":
      return {
        ...state,
        deltaX: action.deltaX,
        deltaY: action.deltaY,
        originX: action.originX,
        originY: action.originY,
        resizing: true,
      };
    case "stopResize":
      return initialState;
    default:
      throw new Error(
        `Unhandled action type: ${(action as LayerMaskAction).type}`,
      );
  }
}

export const LayerMaskContext = createContext<{
  state: LayerMaskState;
  dispatch: (action: LayerMaskAction) => void;
}>({
  state: initialState,
  dispatch: () => null,
});
