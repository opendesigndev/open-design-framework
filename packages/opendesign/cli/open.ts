import path from "node:path";
import { parseArgs } from "node:util";

import { wasm } from "@opendesign/engine-wasm";
import express from "express";
import openUrl from "open";

import { expectedError, packageRoot, reflow } from "./utils.js";

const editorDist = new URL("dist/editor/", packageRoot());

export function execute(args: string[]) {
  const { positionals } = parseArgs({ args, allowPositionals: true });
  if (positionals.length !== 1) {
    throw expectedError("You must specify exactly one file to be opened");
  }
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

  const [file] = args;
  const url = new URL("http://localhost:5151");
  if (file) {
    const filename = path.basename(file);
    url.searchParams.set("file", filename);
    app.get("/designs/" + filename, (req, res) => {
      res.sendFile(path.join(process.cwd(), file));
    });
  }
  app.listen(url.port, () => {
    openUrl(url.toString());
    console.log(`Opening your browser at ${url}`);
  });
}

export function help() {
  console.log("Usage: opendesign open <path to design file>\n");
  console.log(
    reflow(
      `Opens file in Open Design Editor in your default browser. If the file is
in a format other than .octopus, it'll get converted to octopus automatically.`,
    ),
  );
}
