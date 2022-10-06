import * as odf from "./index.js";
//@ts-expect-error
import fs from "node:fs/promises";
//@ts-expect-error
import { saveAs } from "file-saver";

const editor = odf.createEditor({
  content: odf.designFromNodeFile("./file.opendesign"),
  // or: odf.designFromUrl("/public/file/manifest.json"),
});

await odf.waitForFullLoad(editor);

const image = await odf.exportImage(editor, { artboard: "dead-beef" });
await fs.writeFile("image.png", image);
// or trigger save in browser
saveAs(image, "image.png");
