import type { Editor } from "@opendesign/universal";
import type { MountResult } from "@opendesign/universal/dom";
import { createContext, useContext } from "react";

const context = createContext<Editor | null>(null);
const canvasContext = createContext<MountResult | null>(null);

/**
 * Provides editor to a subtree. This allows you to use editor-based hooks
 * without having to pass editor directly.
 * @param props
 */
export function EditorProvider(props: {
  editor: Editor;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <context.Provider value={props.editor}>{props.children}</context.Provider>
  );
}

/**
 * Returns Editor from context. Must be rendered in subtree of
 * {@link @opendesign/react!EditorCanvas} or {@link @opendesign/react!EditorProvider}
 * or you must pass in the editor object. Argument takes precedence over context.
 */
export function useEditorContext(editorOverride?: Editor): Editor {
  const value = useEditorContextOptional(editorOverride);
  if (!value) {
    throw new Error(
      "You must either pass in Editor or render this in a subtree of EditorProvider or EditorCanvas",
    );
  }
  return value;
}

/**
 * Similar to useEditorContext, but does not throw on missing editor.
 *
 * @internal
 */
export function useEditorContextOptional(
  editorOverride?: Editor,
): Editor | null {
  return useContext(context) ?? editorOverride ?? null;
}

/**
 * @internal
 */
export const CanvasContextProvider = canvasContext.Provider;

/**
 * @internal
 */
export function useCanvasContext() {
  const value = useContext(canvasContext);
  if (!value) {
    throw new Error("You must render this in a subtree of EditorCanvas");
  }
  return value;
}
