import {
  EditorCanvas,
  importFromClipboard,
  useEditor,
} from "@opendesign/react";
import type { Manifest } from "@opendesign/universal";
import { readManifest } from "@opendesign/universal";
import { importFile, isOptimizedOctopusFile } from "@opendesign/universal";
import saveAs from "file-saver";
import type { PropsWithChildren } from "react";
import React, { Suspense, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useSearchParams } from "react-router-dom";

async function convert(file: Blob) {
  const data = new Uint8Array(await file.arrayBuffer());
  if (isOptimizedOctopusFile(data.buffer)) return data;
  return importFile(data);
}

export function Import() {
  const [data, setData] = useState<
    null | readonly [number, Uint8Array, Manifest]
  >(null);
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
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
    noClick: true,
  });
  useEffect(() => {
    window.addEventListener("paste", pasteListener as any);
    window.addEventListener("keypress", listener);
    return () => {
      window.removeEventListener("paste", pasteListener as any);
      document.removeEventListener("keypress", listener);
    };
    function pasteListener(event: ClipboardEvent) {
      console.log(importFromClipboard(event));
    }
    function listener(event: KeyboardEvent) {
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        !event.altKey &&
        event.key === "v"
      ) {
        console.log(event);
        console.log(importFromClipboard());
      }
    }
  });
  const [params, setParams] = useSearchParams();
  if (!data) {
    return (
      <div className="w-full h-full p-4" {...getRootProps()}>
        <input {...getInputProps()} />
        <h1 className="text-2xl font-bold mb-2">
          Open Design Framework playground
        </h1>
        {isDragActive ? (
          <p>Drop the file here ...</p>
        ) : (
          <div>
            <p>Drag 'n' drop a design anywhere</p>
            <Button onClick={open}>Or click here to select file</Button>
          </div>
        )}
        <PasteButton />
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
        className="flex flex-col max-w-lg gap-2 p-4"
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
        <Button type="submit">Select</Button>
      </form>
    );
  }
  return (
    <div className="w-full h-full flex flex-col" {...getRootProps()}>
      <input {...getInputProps()} />
      <PasteButton />
      <div className="align-left">
        <ComponentSelect
          manifest={data[2]}
          value={id}
          onChange={(evt) => {
            setParams({ id: evt.currentTarget.value });
          }}
        />
      </div>
      <div className="grow">
        <Content data={data[1]} key={data[0] + id} componentId={id} />
      </div>
    </div>
  );
}

function PasteButton() {
  // Firefox does not support reading from clipboard other than ctrl-v
  if (!navigator.clipboard.readText) return null;
  return (
    <Button
      onClick={(evt) => {
        evt.stopPropagation();
        importFromClipboard();
      }}
    >
      Paste from Figma
    </Button>
  );
}

function Button({
  children,
  onClick,
  type = "button",
}: PropsWithChildren<{
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit";
}>) {
  return (
    <button
      type={type}
      className="justify-center rounded-lg text-sm font-semibold py-2.5 px-4
      bg-slate-900
      text-white hover:bg-slate-700"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ComponentSelect({
  manifest,
  value,
  onChange,
}: {
  manifest: Manifest;
  value?: string;
  onChange?: (evt: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  const components = new Map<string, Manifest["components"][0]>();
  for (const c of manifest.components) components.set(c.id, c);
  return (
    <select name="component" className="p-4" onChange={onChange} value={value}>
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
  const editor = useEditor({
    design: data,
    componentId,
  });
  return (
    <>
      <Suspense>
        <EditorCanvas editor={editor} />
      </Suspense>
      <div className="absolute top-4 right-4">
        <Button onClick={() => void saveAs(new Blob([data]), "file.octopus")}>
          Download .octopus
        </Button>
      </div>
    </>
  );
}
