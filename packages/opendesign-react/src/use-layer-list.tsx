import type { Editor } from "@opendesign/universal";
import { useSyncExternalStore } from "react";

import type { LayerListItem } from "../../opendesign-universal/src/nodes/artboard.js";
import { useWaitForEditorLoaded } from "../index.js";

type useLayerListOptions = {
  naturalOrder?: boolean;
  editorOverride?: Editor;
};
/**
 * Custom hook to get list of layers in the artboard.
 * Updates the list whenever new component is pasted into the artboard.
 *
 * @param options {@link @opendesign/universal!ArtboardNode.getLayers}
 * @param options.naturalOrder - whether to return layers in natural order or not
 * @param options.editorOverride - editor to use instead of the one from context
 * @returns list of layers in the artboard if any or nullish value if no artboard is present
 */
export function useLayerList({
  naturalOrder = true,
  editorOverride,
}: useLayerListOptions): LayerListItem | null | undefined {
  const editor = useWaitForEditorLoaded(editorOverride);
  const layers = useSyncExternalStore(subscribe, () =>
    getSnapshot({ editorOverride: editor, naturalOrder }),
  );

  return JSON.parse(layers);
}

function subscribe(callback: () => void) {
  window.addEventListener("paste", callback);
  return () => void window.removeEventListener("paste", callback);
}

function getSnapshot({ editorOverride, naturalOrder }: useLayerListOptions) {
  const artboard = editorOverride?.currentPage.findArtboard();
  const layers = artboard?.getLayers({ naturalOrder });

  // TODO: stringify is a temporary solution for memoization to make it work with useSyncExternalStore
  return JSON.stringify(layers);
}
