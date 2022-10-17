import type { __internals } from "../internals.js";
import type { BaseNode } from "./node.js";

export type PageNode = BaseNode & {
  [__internals]: true;
  type: "PAGE";
};
