import "./index.css";

import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { convert, EditorComponent } from "./editor.js";

(async () => {
  const params = new URLSearchParams(window.location.search);
  let file: Uint8Array | undefined;
  if (params.has("file")) {
    const res = await fetch("/designs/" + params.get("file"));
    const blob = await res.blob();
    file = await convert(blob);
  }

  const el = document.querySelector("#root")!;
  const root = createRoot(el);
  const router = createBrowserRouter([
    { path: "/", element: <EditorComponent file={file} /> },
  ]);
  root.render(<RouterProvider router={router} />);
})();
