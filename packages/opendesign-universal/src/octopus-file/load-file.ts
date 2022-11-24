import * as fflate from "fflate";

import type { Engine } from "../engine/engine.js";
import { isOctopusFile } from "./detect.js";

export function loadFile(file: Uint8Array, engine: Engine) {
  if (!isOctopusFile(file.buffer)) throw new Error("File must be octopus file");
  const files = fflate.unzipSync(file);
  const manifest = JSON.parse(fflate.strFromU8(files["octopus-manifest.json"]));
  console.log(manifest, " ");
}
