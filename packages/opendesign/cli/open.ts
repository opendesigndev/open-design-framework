import path from "node:path";

import { wasm } from "@opendesign/engine-wasm";
import express from "express";
import openUrl from "open";

const editorDist = new URL("../../dist/editor/", import.meta.url);

export function open(params: string[]) {
  const app = express();
  const indexHtml = new URL("index.html", editorDist).pathname;
  app.use("/", (req, res, next) => {
    if (req.path === "/") res.sendFile(indexHtml);
    else if (req.path === "/engine/ode.wasm")
      res.sendFile(new URL(wasm).pathname);
    else next();
  });
  app.use(
    "/assets",
    express.static(new URL("assets", editorDist).pathname, {
      fallthrough: false,
      immutable: true,
      maxAge: 1000 * 3600 * 24 * 365,
      index: false,
    }),
  );

  const [file] = params;
  const url = new URL("http://localhost:5151");
  if (file) {
    const filename = path.basename(file);
    url.searchParams.set("file", filename);
    app.get("/designs/" + filename, (req, res) => {
      res.sendFile(file);
    });
  }
  app.listen(url.port, () => {
    openUrl(url.toString());
    console.log(`Opening your browser at ${url}`);
  });
}
