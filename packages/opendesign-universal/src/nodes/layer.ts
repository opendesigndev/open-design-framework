import type { BaseNode } from "./node.js";

export type LayerNode = BaseNode & {
  type: "SHAPE" | "TEXT" | "COMPONENT_REFERENCE" | "GROUP" | "MASK_GROUP";
};
