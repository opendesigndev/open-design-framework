import { todo } from "../internals.js";
import type { ArtboardNode } from "./artboard.js";
import type { LayerNode } from "./layer.js";
import type { PageNode } from "./page.js";

export type Node = LayerNode | PageNode | ArtboardNode;

export type NodeFilter<T extends BaseNode = Node> = (
  node: T,
  reserved: unknown
) => boolean;

export type BaseNode = {
  /**
   * Searches through children of the node recursively (= including children)
   * and returns all matching nodes.
   * @param filter
   */
  findAll(filter?: NodeFilter): Node[];

  /**
   * Searches through children of the node recursively (= including children)
   * and returns first matching node.
   * @param filter
   */
  find(filter?: NodeFilter): Node | null;

  /**
   * Renders contents of the node and returns image in specified format.
   * @param options
   */
  exportBitmap(options: { format: "png" }): Promise<ArrayBuffer>;

  /**
   * Marks node as selected, deselecting any other currently-selected node.
   */
  select(): void;

  readonly name: string;
  setName(name: string): void;
};

export class NodeBase implements BaseNode {
  findAll(filter?: NodeFilter): Node[] {
    todo();
  }
  exportBitmap(options: { format: "png" }): Promise<ArrayBuffer> {
    todo();
  }
  find(filter?: NodeFilter): Node | null {
    todo();
  }

  get name() {
    return todo();
  }

  setName(name: string) {
    todo();
  }

  select() {
    todo();
  }
}
