import type { Editor } from "@opendesign/universal";
import { createContext, useContext } from "react";

const context = createContext<Editor | null>(null);

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
  const contextValue = useContext(context);
  const value = editorOverride || contextValue;
  if (!value) {
    throw new Error(
      "You must either pass in Editor or render this in a subtree of EditorProvider or EditorCanvas"
    );
  }
  return value;
}
