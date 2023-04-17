import { spawn } from "child_process";
import z from "zod";

const fontconfigFields = ["postscriptname", "file"] as const;
type Font = { [key in (typeof fontconfigFields)[number]]: string };
/**
 * Lists files using `fc-list` and returns an array of objects with the given
 * properties listed. Run `fc-list -v FontName` to determine list of possible
 * fields.
 *
 * This definitely works on linux, other platforms need to have different
 * implementations. My Macbook does have `fc-list` installed, but it is not
 * installed by default.
 *
 * @private
 */
async function listFontsFontConfig(): Promise<Font[]> {
  const list = await promiseSpawn("fc-list", [
    `--format=${fontconfigFields.map((c) => `%{${c}}`).join("\t")}\n`,
  ]);
  return list.stdout
    .trim()
    .split("\n")
    .map((line) => {
      const fields = line.split("\t");
      return Object.fromEntries(
        fontconfigFields.map((c, i) => [c, fields[i] || ""]),
      ) as any;
    });
}

/**
 * Lists installed fonts on MacOS. Uses system_profiler to determine the list.
 *
 * Also does a sanity check that the output matches expectations. Since most of
 * the fields are not actually used, they are commented out so that if they are
 * missing the validation does not fail if the output changes. But they are
 * still in the list if we ever decide to use them after all.
 */
async function listFontsMacOS() {
  const data = await promiseSpawn("system_profiler", [
    "SPFontsDataType",
    "-json",
  ]);
  // const boolean = z.enum(["yes", "no"]).transform((v) => v === "yes");
  const schema = z.object({
    SPFontsDataType: z.array(
      z.object({
        // _name: z.string(),
        // enabled: boolean,
        path: z.string(),
        // type: z.string(),
        typefaces: z.array(
          z.object({
            _name: z.string(),
            // copy_protected: boolean,
            // copyright: z.string(),
            // duplicate: boolean,
            // embeddable: boolean,
            // enabled: boolean,
            // family: z.string(),
            // fullname: z.string(),
            // outline: boolean,
            // style: z.string(),
            // trademark: z.string().optional(),
            // unique: z.string(),
            // valid: boolean,
            // version: z.string(),
          }),
        ),
      }),
    ),
  });
  return schema
    .parse(JSON.parse(data.stdout))
    .SPFontsDataType.map((font) =>
      font.typefaces.map(
        (typeface): Font => ({
          postscriptname: typeface._name,
          file: font.path,
        }),
      ),
    )
    .flat();
}

/**
 * Determines which font listing method could work and runs it.
 *
 * @returns
 */
async function automaticListFonts(): Promise<Font[]> {
  // fc-list is way faster so try it first
  if (await commandExists("fc-list")) return await listFontsFontConfig();
  // system_profiler is installed on macos by default
  if (await commandExists("system_profiler")) return await listFontsMacOS();
  throw new Error("No available method for determining fonts on this system");
}

/**
 * Lists basic information about fonts installed on the system.
 */
export async function listSystemFonts() {
  const fonts = await automaticListFonts();
  return new Map<string, { postscriptname: string; file: string }>(
    fonts.map((f) => [f.postscriptname.toLowerCase(), f]),
  );
}

/**
 * Spawn a command and return a promise that resolves when the command exits.
 *
 * Rejects if the command exits with a non-zero exit code or if the command
 * cannot be spawned.
 *
 * Simplified from @npmcli/promise-spawn
 *
 * @param cmd
 * @param args
 * @param input
 * @returns
 */
function promiseSpawn(cmd: string, args: readonly string[], input?: string) {
  return new Promise<{ stdout: string; stderr: string }>((res, rej) => {
    const proc = spawn(cmd, args, { stdio: "pipe" });

    const stdout: string[] = [];
    const stderr: string[] = [];

    proc.on("error", rej);

    proc.stdout.setEncoding("utf-8");
    proc.stdout.on("data", (c) => stdout.push(c));
    proc.stdout.on("error", rej);

    proc.stderr.setEncoding("utf-8");
    proc.stderr.on("data", (c) => stderr.push(c));
    proc.stderr.on("error", rej);

    proc.on("close", (code, signal) => {
      if (code || signal) {
        rej(
          new Error(
            "command failed" +
              (code ? " with code " + code : "") +
              (signal ? " with signal " + signal : ""),
          ),
        );
      } else {
        res({
          stdout: stdout.join(""),
          stderr: stderr.join(""),
        });
      }
    });
  });
}

/**
 * Runs which cmd and returns whether it succeeded.
 *
 * @param cmd
 * @returns
 */
function commandExists(cmd: string) {
  return new Promise<boolean>((res, rej) => {
    const proc = spawn("which", [cmd], { stdio: "ignore" });
    proc.on("close", (code, signal) => {
      if (signal) {
        rej(
          new Error(
            "command failed" +
              (code ? " with code " + code : "") +
              (signal ? " with signal " + signal : ""),
          ),
        );
      } else {
        res(!code);
      }
    });
  });
}
