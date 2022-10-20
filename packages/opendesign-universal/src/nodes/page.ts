import type { ArtboardNode } from "./artboard.js";
import type { BaseNode, NodeFilter } from "./node.js";

export type PageNode = BaseNode & {
  type: "PAGE";
  id: string;

  createArtboard(): ArtboardNode;

  /**
   * Searches through artboards in this page and returns first match (if any).
   * @param filter
   */
  findArtboard(filter?: NodeFilter<ArtboardNode>): ArtboardNode | null;
};
