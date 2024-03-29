import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { simpleCli } from "./simple-cli.js";

describe("simple-cli", () => {
  let log = "";
  let error = "";
  let blahExecute = 0;
  let blahHelp = 0;
  console.log = (...args: string[]) => {
    log += args.join(" ") + "\n";
  };
  console.error = (...args: string[]) => {
    error += args.join(" ") + "\n";
  };

  beforeEach(() => {
    log = "";
    error = "";
    blahExecute = 0;
    blahHelp = 0;
  });
  afterEach(() => {
    process.exitCode = undefined;
  });

  function run(args: string[]) {
    return simpleCli({
      commands: {
        blah: async () => ({
          help() {
            console.log("blah help");
            blahHelp++;
          },
          execute(args) {
            console.log("blah execute");
            console.log(args.join(" "));
            blahExecute++;
          },
        }),
      },
      args,
      executable: "opendesign",
      name: "OpenDesign CLI",
    });
  }

  it("should print help", async () => {
    await run(["help"]);
    assert.equal(error, "");
    assert.equal(
      log,
      "OpenDesign CLI. Available subcomands:\n  - help\n  - blah\n\nYou can also run opendesign help <subcommand> to see more info about it.\n",
    );
  });

  async function shouldOutputSameThingAndNoError([
    args1,
    ...rest
  ]: readonly string[][]) {
    await run(args1);
    assert.equal(error, "");
    const log1 = log;
    log = "";
    for (const args2 of rest) {
      await run(args2);
      assert.equal(error, "");
      assert.equal(log, log1);
      log = "";
    }
  }

  it("basic help", async () => {
    await shouldOutputSameThingAndNoError([["help"], ["--help"], ["-h"], []]);
    assert.equal(blahHelp, 0);
    assert.equal(blahExecute, 0);
  });
  it("subcommand help", async () => {
    await shouldOutputSameThingAndNoError([
      ["help", "blah"],
      ["-h", "blah"],
      ["--help", "blah"],
      ["blah", "-h"],
    ]);
    assert.equal(blahHelp, 4);
    assert.equal(blahExecute, 0);
  });

  it("execute", async () => {
    await run(["blah"]);
    assert.equal(error, "");
    assert.equal(log, "blah execute\n\n");
  });

  it("execute with args", async () => {
    await run(["blah", "--abc"]);
    assert.equal(error, "");
    assert.equal(log, "blah execute\n--abc\n");
  });

  it("execute with preceding option", async () => {
    await run(["-v", "blah"]);
    assert.equal(error, "");
    assert.equal(log, "blah execute\n-v\n");
  });

  // missing tests:
  // - unknown subcommand
  // - error in subcommand
});
