import type { Manifest as ManifestTs } from "@opendesign/manifest-ts";
import type { Octopus } from "@opendesign/octopus-ts";

export type OctopusManifest = ManifestTs["schemas"]["OctopusManifest"];

export type OctopusFile = {
  readComponent(
    filename: string,
  ): Promise<Octopus["schemas"]["OctopusComponent"]>;
  readText(filename: string): Promise<string>;
  readBinary(filename: string): Promise<Uint8Array>;

  writeText(filename: string, data: string): Promise<void>;
  writeBinary(filename: string, data: Uint8Array): Promise<void>;
  writeManifest(manifest: OctopusManifest): Promise<void>;
  serialize(): Promise<Uint8Array>;

  readonly manifest: OctopusManifest;
};
