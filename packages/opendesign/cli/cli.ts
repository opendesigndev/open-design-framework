import { simpleCli } from "./simple-cli.js";

const args = process.argv.slice(2);

const commands: {
  [key: string]: () => Promise<{
    execute(args: string[]): Promise<any> | void;
    help?(): void;
  }>;
} = {
  open: () => import("./open.js"),
  convert: () => import("./convert.js"),
};

if (process.env.NODE_ENV !== "production") {
  // Work in progress commands which are not enabled yet in build published to npm
  Object.assign(commands, {
    pack: () => import("./pack.js"),
    "embed-fonts": () => import("./embed-fonts.js"),
  });
}

await simpleCli({
  commands,
  args,
  executable: "opendesign",
  name: "OpenDesign CLI",
});
