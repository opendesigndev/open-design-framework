import { env } from "#env";

import { __internals } from "../internals.js";
import { todo } from "../internals.js";
import type { BaseNode } from "./node.js";
import { NodeBase } from "./node.js";
import type { PageNode } from "./page.js";

export type DocumentNode = BaseNode & {
  [__internals]: unknown;
  readonly currentPage: PageNode;
  /**
   * True when the document is still being loaded from the server
   */
  readonly loading: Promise<void> | false;
};

export class Document extends NodeBase implements DocumentNode {
  [__internals]: {
    currentPage: PageNode | null;
  } = {
    currentPage: null,
  };
  loading: DocumentNode["loading"] = false;

  get currentPage(): PageNode {
    let page = this[__internals].currentPage;
    if (!page) {
      page = todo();
      this[__internals].currentPage = page;
    }
    return page;
  }
}

export function fetchDocument(url: string) {
  const document = new Document();
  document.loading = env
    .fetch(url)
    .then((r) => r.arrayBuffer())
    .then((data) => {
      todo("Read document from ArrayBuffer");
    });
  return document;
}
