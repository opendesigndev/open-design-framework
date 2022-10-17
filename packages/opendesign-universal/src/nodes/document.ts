import { env } from "#env";

import { __internals } from "../internals.js";
import { todo } from "../internals.js";
import type { BaseNode } from "./node.js";
import { NodeBase } from "./node.js";
import type { PageNode } from "./page.js";

export type DocumentNode = BaseNode & {
  [__internals]: true;
  readonly currentPage: PageNode;
  /**
   * True when the document is still being loaded from the server
   */
  readonly loading: Promise<void> | false;
};

export class Document extends NodeBase implements DocumentNode {
  [__internals]: true;
  currentPage: PageNode;
  loading: DocumentNode["loading"] = false;

  constructor() {
    super();
    this[__internals] = true;
    this.currentPage = todo();
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
