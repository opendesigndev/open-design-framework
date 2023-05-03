import { createContext } from "react";

export type OriginValues = "top" | "left" | "right" | "bottom" | "center";

export type Origin = OriginValues | readonly [OriginValues, OriginValues];

export type LayerMaskState = {
  altKey: boolean;
  containerRef: React.RefObject<HTMLDivElement> | null;
  deltaX: number;
  deltaY: number;
  origin: Origin;
  originalHeight: number;
  originalWidth: number;
  resizing: boolean;
  resizingEnded: boolean;
  resizingHandle: EventTarget | null;
  resizingStarted: boolean;
  shiftKey: boolean;
  startX: number;
  startY: number;
};

export type LayerMaskAction =
  | {
      type: "setOriginalSize";
      originalWidth: number;
      originalHeight: number;
    }
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
      shiftKey: boolean;
      altKey: boolean;
      deltaX: number;
      deltaY: number;
      originX: OriginValues;
      originY: OriginValues;
    }
  | {
      type: "stopResize";
    };

export const initialState: LayerMaskState = {
  altKey: false,
  containerRef: null,
  deltaX: 0,
  deltaY: 0,
  origin: ["left", "top"],
  originalHeight: 0,
  originalWidth: 0,
  resizing: false,
  resizingEnded: true,
  resizingHandle: null,
  resizingStarted: false,
  shiftKey: false,
  startX: 0,
  startY: 0,
};

export function reducer(
  state: LayerMaskState,
  action: LayerMaskAction,
): LayerMaskState {
  switch (action.type) {
    case "setOriginalSize":
      return {
        ...state,
        originalWidth: action.originalWidth,
        originalHeight: action.originalHeight,
      };
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
        resizingStarted: true,
        resizingEnded: false,
      };
    case "resize":
      // TODO: make sure original proportions are kept and restored on shiftKey
      const [deltaX, deltaY] = getBalancedDelta(
        action.deltaX,
        action.deltaY,
        action.shiftKey,
      );
      return {
        ...state,
        shiftKey: action.shiftKey,
        deltaX: deltaX,
        deltaY: deltaY,
        origin: action.altKey ? "center" : [action.originX, action.originY],
        resizingStarted: true,
        resizingEnded: false,
        resizing: true,
      };
    case "stopResize":
      return {
        ...initialState,
        resizingEnded: true,
      };
    default:
      throw new Error(
        `Unhandled action type: ${(action as LayerMaskAction).type}`,
      );
  }
}

function getBalancedDelta(
  deltaX: number,
  deltaY: number,
  shiftKey: boolean,
): [number, number] {
  if (shiftKey) {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return [deltaX, deltaX];
    }
    return [deltaY, deltaY];
  }

  return [deltaX, deltaY];
}

export const LayerMaskContext = createContext<{
  state: LayerMaskState;
  dispatch: (action: LayerMaskAction) => void;
}>({
  state: initialState,
  dispatch: () => null,
});
