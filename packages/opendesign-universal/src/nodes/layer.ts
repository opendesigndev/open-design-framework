import type { BaseNode } from "./node.js";

export interface LayerNode extends BaseNode {
  type: "SHAPE" | "TEXT" | "COMPONENT_REFERENCE" | "GROUP" | "MASK_GROUP";
}
