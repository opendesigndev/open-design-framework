import { parseArgs } from "node:util";

import chalk from "chalk";

import { isExpectedError } from "./utils.js";

export async function simpleCli({
  commands,
  args,
  name,
  executable,
}: {
  commands: {
    [key: string]: () => Promise<{
      execute(args: string[]): Promise<any> | void;
      help?(): void;
    }>;
  };
  args: string[];
  name: string;
  executable: string;
}) {
  try {
    // This makes sure that `executable -v cmd` is the same as `executable cmd -v`
    const looselyParsed = parseArgs({
      args,
      strict: false,
      options: { help: { type: "boolean", short: "h" } },
    });
    const cmd = looselyParsed.positionals[0];
    if (cmd === "help" || !cmd || looselyParsed.values.help) {
      await help();
    } else {
      await subcommand(cmd);
    }
  } catch (e: any) {
    if (isExpectedError(e)) {
      console.error(chalk.red(e.message));
      process.exitCode = 1;
    } else if (
      typeof e === "object" &&
      e?.code === "ERR_PARSE_ARGS_UNKNOWN_OPTION"
    ) {
      console.error(chalk.red(e.message));
      process.exitCode = 1;
    } else {
      throw e;
    }
  }

  async function subcommand(cmd: string) {
    if (cmd in commands) {
      const index = args.indexOf(cmd);
      const filteredArgs = args.filter((_, i) => i !== index);
      const mod = await commands[cmd]();

      await mod.execute(filteredArgs);
    } else {
      console.error("Unkown subcommand %s", chalk.bold(cmd));
      process.exitCode = 1;
    }
  }

  async function help() {
    const cmd = getHelpCmd(args);
    if (!cmd) {
      printBasicHelp();
    } else if (cmd in commands) {
      const mod = await commands[cmd]();
      const help =
        "help" in mod && typeof mod.help === "function" ? mod.help : null;
      if (!help) {
        console.error(
          "Subcommand %s exists but help for it can't be found",
          chalk.bold(cmd),
        );
        process.exitCode = 1;
      } else {
        help();
      }
    } else {
      console.error(
        "Can't print help for unknown subcommand %s",
        chalk.bold(cmd),
      );
      process.exitCode = 1;
    }
  }

  function printBasicHelp() {
    console.log(`${name}. Available subcomands:`);
    console.log("  - help");
    for (const key of Object.keys(commands)) {
      console.log("  -", key);
    }
    console.log();
    console.log(
      `You can also run ${executable} help <subcommand> to see more info about it.`,
    );
  }
}

function getHelpCmd(args: string[]) {
  const parsed = parseArgs({
    args,
    allowPositionals: true,
    options: { help: { type: "boolean", short: "h" } },
  });
  if (parsed.values.help) {
    if (parsed.positionals.length > 1) throw new Error("Too many arguments");
    return parsed.positionals[0] ?? null;
  }
  if (parsed.positionals.length > 2) {
    throw new Error("Too many arguments");
  }
  if (parsed.positionals.length <= 1) return null;
  return parsed.positionals[1];
}
