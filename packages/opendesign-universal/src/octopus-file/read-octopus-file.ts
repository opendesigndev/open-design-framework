import type { Octopus } from "@opendesign/octopus-ts";
import * as fflate from "fflate";

import { isOptimizedOctopusFile } from "./detect.js";
import type { OctopusFile, OctopusManifest } from "./octopus-file.js";
import { mergeUint8Arrays } from "./octopus-file-utils.js";

class InMemoryOctopusFile implements OctopusFile {
  #files;
  #manifest: OctopusManifest;
  constructor(file: Uint8Array) {
    if (!isOptimizedOctopusFile(file.buffer))
      throw new Error("File must be octopus file");

    this.#files = readZipFiles(file);
    const manifestFile = this.#files.get("octopus-manifest.json");
    if (!manifestFile)
      throw new Error("Invalid octopus file - missing manifest");

    this.#manifest = JSON.parse(fflate.strFromU8(readFile(manifestFile)));
  }

  async readBinary(filename: string): Promise<Uint8Array> {
    const file = this.#files.get(filename);
    if (!file) throw new Error(`File ${filename} not found`);
    return readFile(file);
  }

  async readComponent(
    filename: string,
  ): Promise<Octopus["schemas"]["OctopusComponent"]> {
    let component = await this.readText(filename);
    // breaking change introduced in OCTOPUS_VERSION "3.0.0-alpha.41"
    // TODO: remove this once all octopus-producing codepaths emit this
    component = component.replace(
      /"type":( *)"ARTBOARD"/,
      '"type":$1"OCTOPUS_COMPONENT"',
    );
    const parsed = JSON.parse(component);
    // TODO: fully verify that the result is valid
    if (!parsed?.type || parsed.type !== "OCTOPUS_COMPONENT") {
      throw new Error(`Invalid component ${filename}`);
    }
    return parsed;
  }

  async readText(filename: string): Promise<string> {
    const binary = await this.readBinary(filename);
    return fflate.strFromU8(binary);
  }

  get manifest(): OctopusManifest {
    return this.#manifest;
  }
}

export function readOctopusFile(file: Uint8Array): OctopusFile {
  return new InMemoryOctopusFile(file);
}

type UnzipFile = fflate.UnzipFile & {
  chunks?: Uint8Array[];
  resolve?: (result: Uint8Array) => void;
  reject?: (err: any) => void;
};

function readZipFiles(file: Uint8Array) {
  const files = new Map<string, fflate.UnzipFile>();
  const unzipper = new fflate.Unzip((file) => {
    files.set(file.name, file);
  });
  unzipper.register(fflate.UnzipInflate);
  unzipper.push(file, true);

  return files;
}

function readFile(fileIn: FileInMap) {
  if (!("start" in fileIn)) return fileIn;
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
  final: boolean,
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
