import { EditorCanvas, useEditor } from "@opendesign/react";
import { importFile, isOctopusFile } from "@opendesign/universal";
import saveAs from "file-saver";
import { Suspense, useState } from "react";
import { useDropzone } from "react-dropzone";

async function convert(file: Blob) {
  // Load example file. Please note that it is hand-modified file so that we do
  // not have large files in the repo.
  const data = new Uint8Array(await file.arrayBuffer());
  if (isOctopusFile(data.buffer)) return data;
  return importFile(data);
}

export function Import() {
  const [data, setData] = useState<null | readonly [number, Uint8Array]>(null);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      const file = files[0];
      if (!file) return;
      convert(file)
        .then((data) =>
          setData((prev) => (prev ? [prev[0] + 1, data] : [0, data]))
        )
        .catch((err) => {
          console.error(err);
        });
    },
    noClick: !!data,
  });
  if (!data) {
    return (
      <div className="w-full h-full" {...getRootProps()}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the file here ...</p>
        ) : (
          <p>Drag 'n' drop a design here, or click to select file</p>
        )}
      </div>
    );
  }
  return (
    <div className="w-full h-full" {...getRootProps()}>
      <input {...getInputProps()} />
      <Content data={data[1]} key={data[0]} />
    </div>
  );
}

function Content({ data }: { data: Uint8Array }) {
  const editor = useEditor({ design: data });
  return (
    <>
      <Suspense>
        <EditorCanvas editor={editor} />
      </Suspense>
      <button
        className="absolute top-4 right-4
            justify-center rounded-lg text-sm font-semibold py-2.5 px-4
            bg-slate-900
            text-white hover:bg-slate-700"
        onClick={() => {
          saveAs(new Blob([data]), "file.octopus");
        }}
      >
        Download .octopus
      </button>
    </>
  );
}
