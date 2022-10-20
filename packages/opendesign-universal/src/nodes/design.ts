import { env } from "#env";

import { __internals } from "../internals.js";
import { todo } from "../internals.js";
import type { ArtboardNode } from "./artboard.js";
import type { BaseNode, NodeFilter } from "./node.js";
import { NodeBase } from "./node.js";
import type { PageNode } from "./page.js";

export type DesignNode = BaseNode & {
  [__internals]: unknown;
  readonly currentPage: PageNode;

  /**
   * True when the document is still being loaded from the server
   */
  readonly loading: Promise<void> | false;

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
};

/**
 * @internal
 */
export class DesignImplementation extends NodeBase implements DesignNode {
  [__internals]: {
    currentPage: PageNode | null;
  } = {
    currentPage: null,
  };
  loading: DesignNode["loading"] = false;

  get currentPage(): PageNode {
    let page = this[__internals].currentPage;
    if (!page) {
      page = todo();
      this[__internals].currentPage = page;
    }
    return page;
  }

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

export function fetchDocument(url: string) {
  const document = new DesignImplementation();
  document.loading = env
    .fetch(url)
    .then((r) => r.arrayBuffer())
    .then((data) => {
      todo("Read document from ArrayBuffer");
    });
  return document;
}
