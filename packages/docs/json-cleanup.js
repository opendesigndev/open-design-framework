import fs from "fs";

const file = new URL("./dist/docs.json", import.meta.url);
const docs = JSON.parse(fs.readFileSync(file, "utf-8"));
traverse(docs, (obj, loc) => {
  if (
    typeof obj === "object" &&
    obj &&
    obj.name === "octopus" &&
    obj.kindString === "Parameter"
  ) {
    obj.type = {};
    return "SKIP";
  }
});
fs.writeFileSync(file, JSON.stringify(docs), "utf-8");

function traverse(obj, cb, loc = "") {
  if (cb(obj, loc || "/") === "SKIP") return;
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => void traverse(v, cb, loc + "/" + i));
  } else if (typeof obj === "object" && obj) {
    for (const [k, v] of Object.entries(obj)) {
      traverse(v, cb, loc + "/" + k);
    }
  }
}
