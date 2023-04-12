import assert from "node:assert";
import * as test from "node:test";

import { reflow } from "./utils.js";

test.describe("flow", () => {
  const input = "lorem ipsum verylongwordthing sit amet";
  const testcases = [
    "lorem\nipsum\nverylongwordthing\nsit\namet", // 0
    "lorem\nipsum\nverylongwordthing\nsit\namet", // 1
    "lorem\nipsum\nverylongwordthing\nsit\namet", // 2
    "lorem\nipsum\nverylongwordthing\nsit\namet", // 3
    "lorem\nipsum\nverylongwordthing\nsit\namet", // 4
    "lorem\nipsum\nverylongwordthing\nsit\namet", // 5
    "lorem\nipsum\nverylongwordthing\nsit\namet", // 6
    "lorem\nipsum\nverylongwordthing\nsit\namet", // 7
    "lorem\nipsum\nverylongwordthing\nsit amet", //  8
    "lorem\nipsum\nverylongwordthing\nsit amet", //  9
    "lorem\nipsum\nverylongwordthing\nsit amet", // 10
    "lorem ipsum\nverylongwordthing\nsit amet", //  11
    "lorem ipsum\nverylongwordthing\nsit amet", //  12
    "lorem ipsum\nverylongwordthing\nsit amet", //  13
    "lorem ipsum\nverylongwordthing\nsit amet", //  14
    "lorem ipsum\nverylongwordthing\nsit amet", //  15
    "lorem ipsum\nverylongwordthing\nsit amet", //  16
    "lorem ipsum\nverylongwordthing\nsit amet", //  17
    "lorem ipsum\nverylongwordthing\nsit amet", //  18
    "lorem ipsum\nverylongwordthing\nsit amet", //  19
    "lorem ipsum\nverylongwordthing\nsit amet", //  20
    "lorem ipsum\nverylongwordthing sit\namet", //  21
    "lorem ipsum\nverylongwordthing sit\namet", //  22
    "lorem ipsum\nverylongwordthing sit\namet", //  23
    "lorem ipsum\nverylongwordthing sit\namet", //  24
    "lorem ipsum\nverylongwordthing sit\namet", //  25
    "lorem ipsum\nverylongwordthing sit amet", //   26
    "lorem ipsum\nverylongwordthing sit amet", //   27
    "lorem ipsum\nverylongwordthing sit amet", //   28
    "lorem ipsum verylongwordthing\nsit amet", //   29
    "lorem ipsum verylongwordthing\nsit amet", //   30
    "lorem ipsum verylongwordthing\nsit amet", //   31
    "lorem ipsum verylongwordthing\nsit amet", //   32
    "lorem ipsum verylongwordthing sit\namet", //   33
    "lorem ipsum verylongwordthing sit\namet", //   34
    "lorem ipsum verylongwordthing sit\namet", //   35
    "lorem ipsum verylongwordthing sit\namet", //   36
    "lorem ipsum verylongwordthing sit\namet", //   37
    "lorem ipsum verylongwordthing sit amet", //    38
    "lorem ipsum verylongwordthing sit amet", //    39
  ];
  for (let i = 0; i < 40; i++) {
    assert.strictEqual(reflow(input, i), testcases[i]);
  }
  assert.strictEqual(reflow("have b bacon", 6), "have b\nbacon");
  assert.strictEqual(reflow("have a bacon", 6), "have\na bacon");
  assert.strictEqual(
    reflow("have an egg and a sandwich", 7),
    "have\nan egg\nand\na sandwich",
  );
});
