import { todo } from "../internals.js";
import type { ArtboardNode } from "./artboard.js";
import type { BaseNode, NodeFilter } from "./node.js";
import { BaseNodeImpl } from "./node.js";
import type { PageNode } from "./page.js";

export interface DesignNode extends BaseNode {
  /**
   * Returns first page which matches the filter
   */
  findPage(filter: NodeFilter<PageNode>): PageNode;

  /**
   * Creates a page, adds it to this document and returns it.
   */
  createPage(): PageNode;

  /**
   * Searches through artboards in all pages and returns first match (if any).
   * @param filter
   */
  findArtboard(filter?: NodeFilter<ArtboardNode>): ArtboardNode | null;
}

/**
 * @internal
 */
export class DesignImplementation extends BaseNodeImpl implements DesignNode {
  findPage(filter: NodeFilter<PageNode>): PageNode {
    todo();
  }

  createPage(): PageNode {
    todo();
  }

  findArtboard(
    filter?: NodeFilter<ArtboardNode> | undefined
  ): ArtboardNode | null {
    todo();
  }
}
