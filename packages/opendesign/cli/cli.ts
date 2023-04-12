import { parseArgs } from "node:util";

import chalk from "chalk";

import { isExpectedError } from "./utils.js";

const args = process.argv.slice(2);

const commands = {
  open: () => import("./open.js"),
  pack: () => import("./pack.js"),
} as const;

// This makes sure that `opendesign -v cmd` is the same as `opendesign cmd -v`
const looselyParsed = parseArgs({ args, strict: false });
const cmd = looselyParsed.positionals[0];
if (isValidCommand(cmd)) {
  const index = args.indexOf(cmd);
  const filteredArgs = args.filter((_, i) => i !== index);
  const mod = await commands[cmd]();
  try {
    mod.execute(filteredArgs);
  } catch (e) {
    if (isExpectedError(e)) {
      console.error(chalk.red(e.message));
      process.exitCode = 1;
    } else {
      throw e;
    }
  }
} else if (cmd === "help" || !cmd) {
  const parsed = parseArgs({ allowPositionals: true });
  const cmd = parsed.positionals[1];
  if (parsed.positionals.length > 2) {
    throw new Error("Too many arguments");
  } else if (parsed.positionals.length <= 1) {
    printBasicHelp();
  } else if (isValidCommand(cmd)) {
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
} else if (cmd) {
  console.error("Unkown subcommand", cmd);
  process.exitCode = 1;
}

function isValidCommand(v: string): v is keyof typeof commands {
  return v in commands;
}

function printBasicHelp() {
  console.log("OpenDesign CLI. Available subcomands:");
  console.log("  - help");
  for (const key of Object.keys(commands)) {
    console.log("  -", key);
  }
  console.log();
  console.log(
    "You can also run opendesign help <subcommand> to see more info about it.",
  );
}
