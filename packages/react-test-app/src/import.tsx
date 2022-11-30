import { EditorCanvas, useEditor } from "@opendesign/react";
import type { Manifest } from "@opendesign/universal";
import { readManifest } from "@opendesign/universal";
import { importFile, isOptimizedOctopusFile } from "@opendesign/universal";
import saveAs from "file-saver";
import React, { Suspense, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useSearchParams } from "react-router-dom";

async function convert(file: Blob) {
  // Load example file. Please note that it is hand-modified file so that we do
  // not have large files in the repo.
  const data = new Uint8Array(await file.arrayBuffer());
  if (isOptimizedOctopusFile(data.buffer)) return data;
  return importFile(data);
}

export function Import() {
  const [data, setData] = useState<
    null | readonly [number, Uint8Array, Manifest]
  >(null);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      const file = files[0];
      if (!file) return;
      convert(file)
        .then((data) =>
          setData((prev) =>
            prev
              ? [prev[0] + 1, data, readManifest(data)]
              : [0, data, readManifest(data)]
          )
        )
        .catch((err) => {
          console.error(err);
        });
    },
    noClick: !!data,
  });
  const [params, setParams] = useSearchParams();
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
  const id = params.get("id");
  if (!id || !data[2].components.some((c) => c.id === id)) {
    console.log(data[2].components.map((c) => c.id));
    const components = new Map<string, Manifest["components"][0]>();
    for (const c of data[2].components) components.set(c.id, c);
    return (
      <form
        className="flex flex-col max-w-lg gap-2 m-4"
        onSubmit={(evt) => {
          evt.preventDefault();
          const data = new FormData(evt.currentTarget);
          const id = data.get("component");
          if (typeof id === "string") setParams({ id });
        }}
      >
        <label className="flex flex-col">
          Select artboard:
          <ComponentSelect manifest={data[2]} />
        </label>
        <button
          className="
            justify-center rounded-lg text-sm font-semibold py-2.5 px-4
            bg-slate-900
            text-white hover:bg-slate-700"
        >
          Select
        </button>
      </form>
    );
  }
  return (
    <div className="w-full h-full" {...getRootProps()}>
      <input {...getInputProps()} />
      <ComponentSelect
        manifest={data[2]}
        onChange={(evt) => {
          setParams({ id: evt.currentTarget.value });
        }}
      />
      <Content data={data[1]} key={data[0] + id} componentId={id} />
    </div>
  );
}

function ComponentSelect({
  manifest,
  onChange,
}: {
  manifest: Manifest;
  onChange?: (evt: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  const components = new Map<string, Manifest["components"][0]>();
  for (const c of manifest.components) components.set(c.id, c);
  return (
    <select
      name="component"
      defaultValue={manifest.components[0].id}
      className="p-4"
      onChange={onChange}
    >
      {manifest.pages.map((page) =>
        page.children.map((ref) => {
          const component = components.get(ref.id);
          if (!component) return null;
          components.delete(ref.id);
          return (
            <option key={ref.id} value={ref.id}>
              {page.name} / {components.get(component.id)?.name ?? ""}
            </option>
          );
        })
      )}
      {Array.from(components.values(), (component) => (
        <option key={component.id} value={component.id}>
          {component.name}
        </option>
      ))}
    </select>
  );
}

function Content({
  data,
  componentId,
}: {
  data: Uint8Array;
  componentId: string;
}) {
  const editor = useEditor({ design: data, componentId });
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
