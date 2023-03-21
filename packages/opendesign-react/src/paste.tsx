import type { Editor, ImportedClipboardData } from "@opendesign/universal";
import { importFromClipboard } from "@opendesign/universal/dom";
import { useCallback, useEffect } from "react";

import { useEditorContextOptional } from "./context.js";

export type PasteEvent = {
  data: ImportedClipboardData | string | null;
  event: ClipboardEvent | null;
  preventDefault(this: PasteEvent): void;
  defaultPrevented: boolean;
};

/**
 * Adds listener for paste event. Default behavior is to paste into current page,
 * If input data could not be interpreted, then no default action is taken.
 *
 * If you want to customize this, then add listener and call .preventDefault()
 * on resulting event and do what you need with the data. preventDefault has to
 * be called synchronously (similar to browser events).
 *
 * This hook also returns function which you can call to trigger paste yourself.
 * This is useful for example for implementing custom context menu, or custom
 * keyboard shortcuts. If browser does not support required APIs for reading
 * clipboard directly, then this function returns null. Do provide fallback for
 * this situation, because no non-chrome browser currently support this.
 *
 * The listener will receive one of the following:
 * - ImportedClipboardData which you can use to paste design, or inspect manually
 * - string with contents of the clipboard, if clipboard is textual
 * - null
 *
 * If data comes from event (not manual trigger), then it will also receive a
 * ClipboardEvent.
 *
 * editor (either from context or via second argument) is only required if you
 * do not call .preventDefault() in the callback
 *
 * ## Minimal usage
 *
 * ```typescript
 * usePaste();
 * ```
 *
 * ## Usage of return value
 *
 * ```typescript
 * function PasteButton() {
 *   const triggerPaste = usePaste();
 *
 *   // Firefox does not support reading from clipboard other than ctrl-v
 *   if (!triggerPaste) return <div>Paste by pressing Ctrl+V</div>;
 *
 *   return <Button onClick={triggerPaste}>Paste</Button>;
 * }
 * ```
 *
 * ## Replicating default behavior in callback
 *
 * ```typescript
 * const editor = useEditorContext();
 * usePaste(event => {
 *   event.preventDefault();
 *   editor.currentPage.paste(event.data).then(
 *     () => console.log('Success'),
 *     (err) => console.error(err),
 *   );
 * });
 * ```
 *
 * @param onPaste
 * @param editorOverride
 */
export function usePaste(
  onPaste?: (event: PasteEvent) => void,
  editorOverride?: Editor,
): null | (() => void) {
  const editor = useEditorContextOptional(editorOverride);
  if (!editor && !onPaste) {
    throw new Error(
      "You must either pass in Editor or render this in a subtree of EditorProvider or EditorCanvas or pass onPaste handler",
    );
  }

  const handlePaste = useCallback(
    (
      data: ImportedClipboardData | string | null,
      event: ClipboardEvent | null = null,
    ) => {
      if (data) {
        const pasteEvent = {
          data,
          event,
          defaultPrevented: false,
          preventDefault,
        };
        onPaste?.(pasteEvent);
        if (!pasteEvent.defaultPrevented && typeof data !== "string") {
          editor?.currentPage
            .paste(data)
            .catch((err) => void console.error(err));
        }
      }
    },
    [editor, onPaste],
  );

  useEffect(() => {
    window.addEventListener("paste", pasteListener as any);
    return () => void window.removeEventListener("paste", pasteListener as any);
    function pasteListener(event: ClipboardEvent) {
      importFromClipboard(event)
        .then((data) => handlePaste(data, event))
        .catch((error) => void console.error(error));
    }
  });
  if (!!navigator.clipboard?.readText) {
    return () => void importFromClipboard().then(handlePaste);
  }
  return null;
}

function preventDefault(this: { defaultPrevented: boolean }) {
  this.defaultPrevented = true;
}
