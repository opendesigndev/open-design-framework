import type { __internals } from "../internals.js";
import type { BaseNode } from "./node.js";

export type LayerNode = BaseNode & {
  [__internals]: true;
  type: "SHAPE" | "TEXT" | "COMPONENT_REFERENCE" | "GROUP" | "MASK_GROUP";
};
