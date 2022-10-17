import { todo } from "../internals.js";
import type { LayerNode } from "./layer.js";
import type { PageNode } from "./page.js";

export type Node = LayerNode | PageNode;

export type BaseNode = {
  findAll(filter: (node: Node) => boolean): Node[];
};

export class NodeBase implements BaseNode {
  findAll(filter: (node: Node) => boolean): Node[] {
    todo();
  }
}
