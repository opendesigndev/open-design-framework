import { EditorCanvas, useEditor } from "@avocode/opendesign-react";

import { createRoot } from "react-dom/client";

const el = document.createElement("div");
document.body.appendChild(el);
const root = createRoot(el);
root.render(<App />);

function App() {
  const editor = useEditor("/path/to/manifest.json"); // this will be fetched
  return <EditorCanvas editor={editor} />;
}
