import type { PasteEvent } from "@opendesign/react";
import {
  EditorCanvas,
  EditorProvider,
  useEditor,
  usePaste,
} from "@opendesign/react";
import type {
  Editor,
  ImportedClipboardData,
  Manifest,
} from "@opendesign/universal";
import {
  importFile,
  isOptimizedOctopusFile,
  readManifest,
} from "@opendesign/universal";
import saveAs from "file-saver";
import type { PropsWithChildren } from "react";
import React, { Suspense, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useSearchParams } from "react-router-dom";

import type { LayerListItem } from "../../opendesign-universal/src/nodes/artboard.js";

async function convert(file: Blob) {
  const data = new Uint8Array(await file.arrayBuffer());
  if (isOptimizedOctopusFile(data.buffer)) return data;
  return importFile(data);
}

export function Import() {
  const [data, setData] = useState<
    | null
    | { type: "file"; fileKey: number; data: Uint8Array; manifest: Manifest }
    | { type: "paste"; data: ImportedClipboardData }
  >(null);
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (files) => {
      const file = files[0];
      if (!file) return;
      convert(file)
        .then((data) =>
          setData((prev) => ({
            type: "file",
            fileKey: (prev && prev.type === "file" ? prev.fileKey : 0) + 1,
            data,
            manifest: readManifest(data),
          })),
        )
        .catch((err) => {
          console.error(err);
        });
    },
    noClick: true,
    noKeyboard: true,
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
        <PasteButton
          onPaste={(event) => {
            if (typeof event.data !== "string" && event.data) {
              setData({ type: "paste", data: event.data });
            }
          }}
        />
      </div>
    );
  }
  const id = params.get("id");
  if (
    data.type === "file" &&
    (!id || !data.manifest.components.some((c) => c.id === id))
  ) {
    console.log(data.manifest.components.map((c) => c.id));
    const components = new Map<string, Manifest["components"][0]>();
    for (const c of data.manifest.components) components.set(c.id, c);
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
          <ComponentSelect manifest={data.manifest} />
        </label>
        <Button type="submit">Select</Button>
      </form>
    );
  }
  return (
    <div className="w-full h-full flex flex-col" {...getRootProps()}>
      <input {...getInputProps()} />

      {data.type === "file" && id ? (
        <div className="align-left">
          <ComponentSelect
            manifest={data.manifest}
            value={id}
            onChange={(evt) => {
              setParams({ id: evt.currentTarget.value });
            }}
          />
        </div>
      ) : null}
      <Content
        data={data}
        key={data.type === "file" ? data.fileKey : 0}
        componentId={id}
      />
    </div>
  );
}

function PasteButton({ onPaste }: { onPaste?: (data: PasteEvent) => void }) {
  const triggerPaste = usePaste(onPaste);

  // Firefox does not support reading from clipboard other than ctrl-v
  if (!triggerPaste) return <div>You can also paste from Figma</div>;

  return <Button onClick={triggerPaste}>Paste from Figma</Button>;
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
        }),
      )}
      {Array.from(components.values(), (component) => (
        <option key={component.id} value={component.id}>
          {component.name}
        </option>
      ))}
    </select>
  );
}

function performPaste(
  editor: Editor,
  data: ImportedClipboardData | string | null,
) {
  if (data && typeof data !== "string") {
    editor.currentPage.paste(data).then(
      () => console.log("success"),
      (error) => {
        console.error(error);
        alert(error);
      },
    );
  }
}

function Content({
  data,
  componentId,
}: {
  data:
    | { type: "file"; data: Uint8Array }
    | { type: "paste"; data: ImportedClipboardData };
  componentId: string | null;
}) {
  const [isReverse, setIsReverse] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [layers, setLayers] = useState<LayerListItem | undefined>();

  const editor = useEditor({
    design: data.type === "file" ? data.data : undefined,
    componentId,
    onLoad(editor) {
      setIsLoaded(true);
      if (data.type === "paste") {
        performPaste(editor, data.data);
      }
    },
    unstable_fallbackFont: "/static/inter.ttf",
  });

  useEffect(() => {
    if (!isLoaded) return;
    const artboard = editor?.currentPage.findArtboard();
    setLayers(artboard?.getListOfLayers(isReverse));
  }, [isReverse, isLoaded, editor]);

  const renderLayer = (layer: LayerListItem | undefined, level = 1) => {
    const nextLevel = level + 1;
    if (!layer) return null;
    return (
      <li
        key={layer.id}
        className="[counter-increment:section] marker:[content:counters(section,'.')] pl-4"
      >
        {layer.name} <small>{layer.type}</small>
        {layer.layers.length ? (
          <ol className="[counter-reset:section] ml-2">
            {layer.layers.map((l) => renderLayer(l, nextLevel))}
          </ol>
        ) : null}
      </li>
    );
  };

  return (
    <>
      <EditorProvider editor={editor}>
        <PasteButton
          onPaste={(evt) => {
            evt.preventDefault();
            performPaste(editor, evt.data);
          }}
        />
        <div className="flex flex-row py-2 grow">
          <div className="basis-1/5">
            <h2 className="text-lg font-semibold mb-2">Layers</h2>
            <Button onClick={() => setIsReverse(!isReverse)}>
              Change order to {!isReverse ? "Reverse" : "Normal"}
            </Button>
            <ol className="[counter-reset:section]">{renderLayer(layers)}</ol>
          </div>
          <div className="basis-4/5">
            <Suspense>
              <EditorCanvas editor={editor} />
            </Suspense>
            {data.type === "file" ? (
              <div className="absolute top-4 right-4">
                <Button
                  onClick={() =>
                    void saveAs(new Blob([data.data]), "file.octopus")
                  }
                >
                  Download .octopus
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </EditorProvider>
    </>
  );
}
