import type { EditorImplementation } from "../editor.js";
import type { Engine } from "../engine/engine.js";
import { loadImages } from "../engine/load-images.js";
import { automaticScope, createStringRef } from "../engine/memory.js";
import { ArtboardNodeImpl } from "../nodes/artboard.js";
import type { PageNodeImpl } from "../nodes/page.js";
import { readOctopusFile } from "./read-octopus-file.js";

export async function loadFile(
  data: Uint8Array,
  engine: Engine,
  editor: EditorImplementation,
  componentId?: string,
) {
  const file = readOctopusFile(data);

  const componentManifest = componentId
    ? file.manifest.components.find((c) => c.id === componentId)
    : file.manifest.components[0];
  if (!componentManifest) {
    if (!componentId) throw new Error("Design does not contain any components");
    else throw new Error("Specified component could not be found");
  }

  const location = componentManifest.location;
  if (location.type === "EXTERNAL")
    throw new Error("External components are not supported yet");
  let component = await file.readText(location.path);
  // breaking change introduced in OCTOPUS_VERSION "3.0.0-alpha.41"
  // TODO: remove this once all octopus-producing codepaths emit this
  component = component.replace(
    /"type":( *)"ARTBOARD"/,
    '"type":$1"OCTOPUS_COMPONENT"',
  );

  const artboard = new ArtboardNodeImpl(
    engine,
    componentManifest.id,
    component,
    editor,
  );
  (editor.currentPage as PageNodeImpl).__artboard = artboard;

  for (const { name, location } of componentManifest.assets?.fonts || []) {
    if (name && location?.type === "RELATIVE" && location.path) {
      const data = await file.readBinary(location.path);
      automaticScope((scope) => {
        const psNameRef = createStringRef(engine.ode, scope, name);
        const faceNameRef = createStringRef(engine.ode, scope, "");

        engine.ode.design_loadFontBytes(
          engine.design,
          psNameRef,
          engine.ode.makeMemoryBuffer(scope, data.buffer),
          faceNameRef,
        );
      });
    }
  }

  return {
    async loadImages() {
      return loadImages(
        engine,
        await Promise.all(
          componentManifest.assets?.images?.map(async (ref) => {
            if (ref.location.type === "EXTERNAL")
              throw new Error("External images are not supported yet");
            const path = ref.location.path;

            return { data: await file.readBinary(path), path };
          }) || [],
        ),
      );
    },
  };
}
