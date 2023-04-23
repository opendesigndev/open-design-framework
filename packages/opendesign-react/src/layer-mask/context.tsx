import { createContext } from "react";

export type LayerMaskState = {
  containerRef: React.RefObject<HTMLDivElement> | null;
  resizingHandle: HTMLElement | null;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  resizing: boolean;
};

export type LayerMaskAction =
  | {
      type: "setRef";
      containerRef: React.RefObject<HTMLDivElement>;
    }
  | {
      type: "startResize";
      resizingHandle: HTMLElement;
      startX: number;
      startY: number;
    }
  | {
      type: "resize";
      deltaX: number;
      deltaY: number;
    }
  | {
      type: "stopResize";
    };

export const initialState = {
  containerRef: null,
  resizingHandle: null,
  startX: 0,
  startY: 0,
  deltaX: 0,
  deltaY: 0,
  resizing: false,
};

export function reducer(state: LayerMaskState, action: LayerMaskAction) {
  switch (action.type) {
    case "setRef":
      console.log("action", action);
      return {
        ...state,
        containerRef: action.containerRef,
      };
    case "startResize":
      console.log("action", action, state);
      return {
        ...state,
        resizingHandle: action.resizingHandle,
        startX: action.startX,
        startY: action.startY,
      };
    case "resize":
      console.log("action", action, state);
      return {
        ...state,
        deltaX: action.deltaX,
        deltaY: action.deltaY,
        resizing: true,
      };
    case "stopResize":
      console.log("action", action);
      return initialState;
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

export const LayerMaskContext = createContext<{
  state: LayerMaskState;
  dispatch: (action: any) => void;
}>({
  state: initialState,
  dispatch: () => null,
});
