const [, , command, ...rest] = process.argv;

if (command === "open") {
  const { open } = await import("./open.js");
  open(rest);
}
console.log("OpenDesign CLI. Available subcomands:");
console.log("  - open [file.octopus]");
