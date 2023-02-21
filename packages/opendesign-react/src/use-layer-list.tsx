import type { Editor } from "@opendesign/universal";
import { useEffect, useState } from "react";

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
export function useLayerList(
  options?: useLayerListOptions,
): LayerListItem | null | undefined {
  const { naturalOrder = true, editorOverride } = options || {};
  const editor = useWaitForEditorLoaded(editorOverride);
  const [layers, setLayers] = useState<LayerListItem | null | undefined>(() =>
    editor?.currentPage.findArtboard()?.getLayers({ naturalOrder }),
  );

  useEffect(() => {
    // need to update layers when order is changed because getLayers doesn't trigger any events in Editor
    setLayers(editor?.currentPage.findArtboard()?.getLayers({ naturalOrder }));

    const unsubscribe = editor?.listen(
      `layersList${naturalOrder ? "" : "Reversed"}`,
      (data) => {
        setLayers(data.layers);
      },
    );

    return unsubscribe;
  }, [editor, naturalOrder]);

  return layers;
}
