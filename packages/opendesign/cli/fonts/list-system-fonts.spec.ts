import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { listSystemFonts } from "./list-system-fonts.js";

describe("list system fonts", () => {
  it("should return something", async () => {
    const fonts = await listSystemFonts();
    assert(fonts.size > 0);
  });
});
