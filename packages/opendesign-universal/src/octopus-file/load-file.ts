import * as env from "@opendesign/env";
import type { Manifest as ManifestTs } from "@opendesign/manifest-ts";
import * as fflate from "fflate";

import type { EditorImplementation } from "../editor.js";
import type { Engine } from "../engine/engine.js";
import { createBitmapRef } from "../engine/engine.js";
import { automaticScope, createStringRef } from "../engine/memory.js";
import { ArtboardNodeImpl } from "../nodes/artboard.js";
import type { PageNodeImpl } from "../nodes/page.js";
import { isOptimizedOctopusFile } from "./detect.js";
import { mergeUint8Arrays } from "./utils.js";

type UnzipFile = fflate.UnzipFile & {
  chunks?: Uint8Array[];
  resolve?: (result: Uint8Array) => void;
  reject?: (err: any) => void;
};

export type Manifest = ManifestTs["schemas"]["OctopusManifest"];
export function readManifest(file: Uint8Array) {
  if (!isOptimizedOctopusFile(file.buffer))
    throw new Error("File must be octopus file");

  const files = readZipFiles(file);
  const manifestFile = files.get("octopus-manifest.json");
  if (!manifestFile) throw new Error("Invalid octopus file - missing manifest");
  const manifest: Manifest = JSON.parse(
    fflate.strFromU8(readFile(manifestFile))
  );
  return manifest;
}

export function loadFile(
  file: Uint8Array,
  engine: Engine,
  editor: EditorImplementation,
  componentId?: string
) {
  if (!isOptimizedOctopusFile(file.buffer))
    throw new Error("File must be octopus file");

  const files = readZipFiles(file);
  const manifestFile = files.get("octopus-manifest.json");
  if (!manifestFile) throw new Error("Invalid octopus file - missing manifest");
  const manifest: Manifest = JSON.parse(
    fflate.strFromU8(readFile(manifestFile))
  );

  const componentManifest = componentId
    ? manifest.components.find((c) => c.id === componentId)
    : manifest.components[0];
  if (!componentManifest) {
    if (!componentId) throw new Error("Design does not contain any components");
    else throw new Error("Specified component could not be found");
  }

  const location = componentManifest.location;
  if (location.type === "EXTERNAL")
    throw new Error("External components are not supported yet");
  const componentFile = files.get(location.path);
  if (!componentFile) throw new Error("Component is missing");
  const component = fflate.strFromU8(readFile(componentFile));
  if (!component) throw new Error("Component not found");
  const artboard = new ArtboardNodeImpl(
    engine,
    componentManifest.id,
    component
  );
  (editor.currentPage as PageNodeImpl).__artboard = artboard;

  return {
    async loadImages() {
      const images = await Promise.all(
        componentManifest.assets?.images?.map(async (ref) => {
          if (ref.location.type === "EXTERNAL")
            throw new Error("External images are not supported yet");
          const path = ref.location.path;
          const imageFile = files.get(path);
          if (!imageFile) throw new Error("Missing image");
          return { data: await env.parseImage(readFile(imageFile)), path };
        }) || []
      );
      const maxBytes = images.reduce(
        (prev, image) => prev + image.data.data.byteLength,
        0
      );
      automaticScope((scope) => {
        const ptr = scope(engine.ode._malloc(maxBytes), engine.ode._free);
        for (const { data, path } of images) {
          const bitmap = createBitmapRef(engine.ode, scope);

          bitmap.pixels = ptr;
          // TODO: make sure that typegen can document constants
          // @ts-expect-error
          bitmap.format = engine.ode.PIXEL_FORMAT_RGBA;
          engine.ode.HEAP8.set(data.data, ptr);
          bitmap.width = data.width;
          bitmap.height = data.height;
          automaticScope((scope) => {
            engine.ode.designLoadImagePixels(
              engine.designImageBase,
              createStringRef(engine.ode, scope, path),
              bitmap
            );
          });
        }
      });
    },
  };
}

function readZipFiles(file: Uint8Array) {
  const files = new Map<string, fflate.UnzipFile>();
  const unzipper = new fflate.Unzip((file) => {
    files.set(file.name, file);
  });
  unzipper.register(fflate.UnzipInflate);
  unzipper.push(file, true);

  return files;
}

function readFile(fileIn: fflate.UnzipFile) {
  let data: Uint8Array | undefined;
  let error: any | undefined;
  const file: UnzipFile = fileIn;
  file.ondata = onData;
  file.chunks = [];
  file.resolve = (v) => {
    data = v;
  };
  file.reject = (err) => {
    error = err;
  };
  file.start();
  if (error) throw error;
  if (data) return data;
  throw new Error("Failed to parse file synchronously");
}

function onData(
  this: UnzipFile,
  err: fflate.FlateError | null,
  data: Uint8Array,
  final: boolean
) {
  if (err) {
    if (this.reject) this.reject(err);
    else throw err;
  }
  const chunks = this.chunks;
  if (!chunks) return;
  chunks.push(data);
  if (final) {
    this.chunks = [];
    this.resolve?.(Uint8Array.from(mergeUint8Arrays(chunks)));
  }
}
