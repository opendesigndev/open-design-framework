import { EditorCanvas, useEditor } from "@opendesign/react";
import { importFile } from "@opendesign/universal";
import { Suspense, useState } from "react";

export function MinimalImport() {
  const [design, setDesign] = useState<Uint8Array | null>(null);

  if (!design) {
    return (
      <input
        type="file"
        onChange={(event) => {
          event.currentTarget
            .files![0].arrayBuffer()
            .then((buffer) => importFile(new Uint8Array(buffer)))
            .then((v) => setDesign(v));
        }}
      />
    );
  }
  return <Editor design={design} />;
}

function Editor({ design }: { design: Uint8Array }) {
  const editor = useEditor({ design });
  return (
    <Suspense fallback="Loading...">
      <EditorCanvas editor={editor} />
    </Suspense>
  );
}
