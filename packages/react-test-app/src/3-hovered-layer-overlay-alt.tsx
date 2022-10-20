import {
  EditorCanvas,
  RelativeMarker,
  useEditor,
  useHoveredNode,
} from "@opendesign/react";
import { Suspense } from "react";

// Using pre-provided hook. Prefer in the declarative case (ie. doing something
// else then collecting stats for example).
export function HoveredLayerOverlay() {
  const editor = useEditor();

  return (
    <Suspense>
      <EditorCanvas editor={editor}>
        <HoverOverlay />
      </EditorCanvas>
    </Suspense>
  );
}

function HoverOverlay() {
  const hoveredNode = useHoveredNode();
  return hoveredNode && hoveredNode.type !== "PAGE" ? (
    <RelativeMarker
      node={hoveredNode}
      // https://developer.mozilla.org/en-US/docs/Web/CSS/inset
      inset={-2}
    >
      <div style={{ border: "2px solid red" }} />
    </RelativeMarker>
  ) : null;
}
