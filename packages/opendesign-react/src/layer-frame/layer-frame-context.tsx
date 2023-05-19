import { createContext } from "react";

export type OriginValues = "top" | "left" | "right" | "bottom" | "center";

export type Origin = OriginValues | readonly [OriginValues, OriginValues];

export type LayerFrameState = {
  altKey: boolean;
  containerRef: React.RefObject<HTMLDivElement> | null;
  deltaX: number;
  deltaY: number;
  newHeight: number;
  newWidth: number;
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

export type LayerFrameAction =
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

export const initialState: LayerFrameState = {
  altKey: false,
  containerRef: null,
  deltaX: 0,
  deltaY: 0,
  newHeight: 0,
  newWidth: 0,
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
  state: LayerFrameState,
  action: LayerFrameAction,
): LayerFrameState {
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
      const [deltaX, deltaY] = calculateShiftDeltas({
        deltaX: action.deltaX,
        deltaY: action.deltaY,
        shiftKey: action.shiftKey,
        originalWidth: state.originalWidth,
        originalHeight: state.originalHeight,
      });
      return {
        ...state,
        shiftKey: action.shiftKey,
        newWidth: state.originalWidth + deltaX,
        newHeight: state.originalHeight + deltaY,
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
        `Unhandled action type: ${(action as LayerFrameAction).type}`,
      );
  }
}

type CalculateShiftDeltasArgs = {
  deltaX: number;
  deltaY: number;
  shiftKey: boolean;
  originalWidth: number;
  originalHeight: number;
};

/**
 * Takes deltas and shiftKey and returns new deltas, to handle shiftKey resizing.
 * @param deltaX - delta X
 * @param deltaY - delta Y
 * @param shiftKey - if shift key is pressed
 * @param originalWidth - original width
 * @param originalHeight - original height
 * @returns [deltaX, deltaY]
 */
function calculateShiftDeltas({
  deltaX,
  deltaY,
  shiftKey,
  originalWidth,
  originalHeight,
}: CalculateShiftDeltasArgs): [number, number] {
  if (shiftKey) {
    const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
    const ratio = originalWidth / originalHeight;
    return [delta, delta / ratio];
  }

  return [deltaX, deltaY];
}

export const LayerFrameContext = createContext<{
  state: LayerFrameState;
  dispatch: (action: LayerFrameAction) => void;
}>({
  state: initialState,
  dispatch: () => null,
});
