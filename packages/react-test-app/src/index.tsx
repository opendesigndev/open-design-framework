import {
  getArtboard,
  centerObject,
  setName,
} from "@avocode/opendesign-universal";
import { EditorCanvas, useEditor } from "@avocode/opendesign-react";

import { createRoot } from "react-dom/client";

const el = document.createElement("div");
document.body.appendChild(el);
const root = createRoot(el);
root.render(<App />);

function App() {
  const editor = useEditor("/path/to/manifest.json", (editor) => {
    const artboard = getArtboard(editor, { id: "feed-dead" });
    centerObject(artboard);
    setName(artboard, "hello there");
  });

  return <EditorCanvas editor={editor} />;
}
