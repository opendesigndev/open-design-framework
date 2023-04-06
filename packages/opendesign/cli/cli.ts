const [, , command, ...rest] = process.argv;

if (command === "open") {
  const { open } = await import("./open.js");
  open(rest);
} else {
  console.log("OpenDesign CLI. Available subcomands:");
  console.log("  - help");
  console.log("  - open [file.octopus]");
  process.exitCode = command && command !== "help" ? 1 : 0;
}
