import type { PasteEvent } from "@opendesign/react";
import { RelativeMarker } from "@opendesign/react";
import { useLayerList } from "@opendesign/react";
import {
  EditorCanvas,
  EditorProvider,
  useEditor,
  usePaste,
} from "@opendesign/react";
import type {
  Editor,
  ImportedClipboardData,
  LayerNode,
  Manifest,
} from "@opendesign/universal";
import {
  importFile,
  isOptimizedOctopusFile,
  readManifest,
} from "@opendesign/universal";
import saveAs from "file-saver";
import type { PropsWithChildren } from "react";
import React, { Suspense, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useSearchParams } from "react-router-dom";

import type { LayerListItem } from "../../opendesign-universal/src/nodes/artboard.js";
import { ErrorBoundary } from "./error-boundary.js";

export async function convert(file: Blob) {
  const data = new Uint8Array(await file.arrayBuffer());
  if (isOptimizedOctopusFile(data.buffer)) return data;
  return importFile(data);
}

export function EditorComponent({ file }: { file?: Uint8Array }) {
  const [data, setData] = useState<
    | null
    | { type: "file"; fileKey: number; data: Uint8Array; manifest: Manifest }
    | { type: "paste"; data: ImportedClipboardData }
  >(
    file
      ? () => ({
          type: "file",
          fileKey: 0,
          data: file,
          manifest: readManifest(file),
        })
      : null,
  );
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
        <h1 className="text-2xl font-bold mb-2">Open Design</h1>
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
          if (typeof id === "string")
            setParams({ ...Object.fromEntries(params.entries()), id });
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
              setParams({
                ...Object.fromEntries(params.entries()),
                id: evt.currentTarget.value,
              });
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

function Layers({
  layers,
  level = 1,
  selected,
}: {
  layers: LayerListItem[];
  level?: number;
  selected?: string;
}) {
  if (!layers || layers?.length === 0) return null;

  return (
    <ol className="[counter-reset:section] ml-2">
      {layers.map(
        (layer) =>
          layer && (
            <li
              key={layer.id}
              className={`[counter-increment:section] marker:[content:counters(section,'.')] pl-4 ${
                layer.id === selected && "bg-violet-300"
              }`}
            >
              {layer.name}
              {layer.layers.length > 0 && (
                <Layers
                  layers={layer.layers}
                  level={level + 1}
                  selected={selected}
                />
              )}
            </li>
          ),
      )}
    </ol>
  );
}

function LayerList({ selected }: { selected?: string }) {
  const [isReverse, setIsReverse] = useState(false);
  const layers = useLayerList({ naturalOrder: !isReverse });

  if (!layers) return null;

  return (
    <>
      <Button onClick={() => setIsReverse(!isReverse)}>
        Change order to {!isReverse ? "Reverse" : "Normal"}
      </Button>
      <Layers layers={layers.layers} selected={selected} />
    </>
  );
}

function SecondLayerList() {
  const layers = useLayerList();
  if (!layers) return null;

  return <Layers layers={layers.layers} />;
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
  const editor = useEditor({
    design: data.type === "file" ? data.data : undefined,
    componentId,
    onLoad(editor) {
      if (data.type === "paste") {
        performPaste(editor, data.data);
      }
    },
    unstable_fallbackFont: new URL("/static/inter.ttf", import.meta.url).href,
  });
  const [selectedLayer, setSelectedLayer] = useState<LayerNode | null>(null);

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
            <Suspense>
              <LayerList selected={selectedLayer?.id} />
            </Suspense>
            <hr />
            <h2 className="text-lg font-semibold mb-2">
              Second layer list (without naturalOrder parameter)
            </h2>
            <Suspense>
              <SecondLayerList />
            </Suspense>
          </div>
          <div className="basis-4/5 border border-dashed">
            <Suspense>
              <EditorCanvas
                editor={editor}
                onClick={({ target }) => {
                  if (
                    target &&
                    target?.type !== "ARTBOARD" &&
                    target.type !== "PAGE"
                  ) {
                    setSelectedLayer(target);
                  }
                }}
              >
                <ErrorBoundary>
                  {selectedLayer ? (
                    <LayerOutline layer={selectedLayer} />
                  ) : null}
                </ErrorBoundary>
              </EditorCanvas>
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

function LayerOutline({ layer }: { layer: LayerNode }) {
  return (
    <RelativeMarker node={layer}>
      <div className="border border-solid border-red-800" />
    </RelativeMarker>
  );
}
