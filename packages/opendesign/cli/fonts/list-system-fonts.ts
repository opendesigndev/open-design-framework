import { spawn } from "child_process";

/**
 * Lists files using `fc-list` and returns an array of objects with the given
 * properties listed. Run `fc-list -v FontName` to determine list of possible
 * fields.
 *
 * This definitely works on linux, other platforms will probably need to have
 * different implementations. My Macbook does have `fc-list` installed, but I am
 * not sure if that is the default.
 *
 * @param cols
 * @returns
 */
async function listFontsFontConfig<T extends string>(
  cols: readonly T[],
): Promise<{ [key in T]: string }[]> {
  const list = await promiseSpawn("fc-list", [
    `--format=${cols.map((c) => `%{${c}}`).join("\t")}\n`,
  ]);
  return list.stdout
    .trim()
    .split("\n")
    .map((line) => {
      const fields = line.split("\t");
      return Object.fromEntries(
        cols.map((c, i) => [c, fields[i] || ""]),
      ) as any;
    });
}

export async function listSystemFonts() {
  const fonts = await listFontsFontConfig(["postscriptname", "family", "file"]);
  return new Map<
    string,
    {
      postscriptname: string;
      family: string;
      file: string;
    }
  >(fonts.map((f) => [f.postscriptname.toLowerCase(), f]));
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
