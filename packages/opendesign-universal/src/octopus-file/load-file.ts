import type { Manifest } from "@opendesign/manifest-ts";
import * as fflate from "fflate";

import type { EditorImplementation } from "../editor.js";
import type { Engine } from "../engine/engine.js";
import { ArtboardNodeImpl } from "../nodes/artboard.js";
import type { PageNodeImpl } from "../nodes/page.js";
import { isOptimizedOctopusFile } from "./detect.js";

export function loadFile(
  file: Uint8Array,
  engine: Engine,
  editor: EditorImplementation
) {
  if (!isOptimizedOctopusFile(file.buffer))
    throw new Error("File must be octopus file");
  const files = fflate.unzipSync(file);
  const manifest: Manifest["schemas"]["OctopusManifest"] = JSON.parse(
    fflate.strFromU8(files["octopus-manifest.json"])
  );

  const component = manifest.components[0];
  if (!component) throw new Error("Design does not contain any components");
  const location = component.location;
  if (location.type === "EXTERNAL")
    throw new Error("External components are not supported yet");
  const octopus = fflate.strFromU8(files[location.path]);
  if (!octopus) throw new Error("Component not found");
  const artboard = new ArtboardNodeImpl(engine, component.id, octopus);
  (editor.currentPage as PageNodeImpl).__artboard = artboard;
}
