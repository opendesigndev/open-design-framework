import {
  ResizeBothHandle,
  ResizeContainer,
  ResizeHeightHandle,
  ResizeWidthHandle,
} from "@mir4a/resize-container-react";
import type { PasteEvent } from "@opendesign/react";
import { RelativeMarker } from "@opendesign/react";
import { LayerMaskWrapper, useLayerList } from "@opendesign/react";
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
  OctopusManifest,
} from "@opendesign/universal";
import {
  importFile,
  isOptimizedOctopusFile,
  readOctopusFile,
} from "@opendesign/universal";
import saveAs from "file-saver";
import type { PropsWithChildren } from "react";
import { useRef } from "react";
import { Ref, useEffect } from "react";
import { useCallback } from "react";
import React, { Fragment, Suspense, useEffect, useMemo, useState } from "react";
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
    | {
        type: "file";
        fileKey: number;
        data: Uint8Array;
        manifest: OctopusManifest;
      }
    | { type: "paste"; data: ImportedClipboardData }
  >(
    file
      ? () => ({
          type: "file",
          fileKey: 0,
          data: file,
          manifest: readOctopusFile(file).manifest,
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
            manifest: readOctopusFile(data).manifest,
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
    const components = new Map<string, OctopusManifest["components"][0]>();
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

      <Content
        data={data}
        key={data.type === "file" ? data.fileKey + (id ?? "") : 0}
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
  manifest: OctopusManifest;
  value?: string;
  onChange?: (evt: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  const components = new Map<string, OctopusManifest["components"][0]>();
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
  onLayerSelect,
}: {
  layers: LayerListItem[];
  level?: number;
  selected?: string;
  onLayerSelect: (id: string) => void;
}) {
  if (!layers || layers?.length === 0) return null;

  return (
    <ol>
      {layers.map((layer) =>
        layer ? (
          <Fragment key={layer.id}>
            <li
              key={layer.id}
              onClick={
                layer.layers.length ? undefined : () => onLayerSelect(layer.id)
              }
              className={`${
                layer.id === selected
                  ? "bg-blue-700 text-white"
                  : layer.layers.length
                  ? ""
                  : "hover:border hover:border-blue-700 hover:bg-blue-200"
              } flex items-center rounded py-1 border border-transparent`}
              style={{ paddingLeft: `${level * 0.5}rem` }}
            >
              {layer.name}
            </li>
            <Layers
              layers={layer.layers}
              level={level + 1}
              selected={selected}
              onLayerSelect={onLayerSelect}
            />
          </Fragment>
        ) : null,
      )}
    </ol>
  );
}

function LayerList({
  selected,
  onLayerSelect,
}: {
  selected?: string;
  onLayerSelect: (id: string) => void;
}) {
  const layers = useLayerList();

  if (!layers) return null;

  return (
    <Layers
      layers={layers.layers}
      selected={selected}
      onLayerSelect={onLayerSelect}
    />
  );
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
    wasmLocation: "/engine/ode.wasm",
    unstable_fallbackFont: new URL("/static/inter.ttf", import.meta.url).href,
  });
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  usePaste((evt) => {
    evt.preventDefault();
    performPaste(editor, evt.data);
  }, editor);
  const selectedLayer = useMemo(
    () =>
      selectedLayerId
        ? editor.currentPage.findArtboard()?.getLayerById(selectedLayerId)
        : null,
    [editor, selectedLayerId],
  );
  useEffect(() => {
    console.log(selectedLayer?.readMetrics());
  }, [selectedLayer]);

  return (
    <EditorProvider editor={editor}>
      <div className="flex flex-row grow">
        <div className="basis-1/5 min-w-[200px] p-2">
          <div className="h-14 flex items-center p-1">
            <h2 className="text-lg font-semibold mb-2">Layers</h2>
          </div>
          <Suspense>
            <LayerList
              selected={selectedLayer?.id}
              onLayerSelect={setSelectedLayerId}
            />
          </Suspense>
        </div>
        <div className="basis-4/5 border-l min-w-[300px] border-dashed">
          <Suspense>
            <EditorCanvas
              editor={editor}
              onClick={({ target }) => {
                if (
                  target &&
                  target?.type !== "ARTBOARD" &&
                  target.type !== "PAGE"
                ) {
                  setSelectedLayerId(target.id);
                }
              }}
            >
              <ErrorBoundary>
                {selectedLayer ? <LayerOutline layer={selectedLayer} /> : null}
              </ErrorBoundary>
            </EditorCanvas>
          </Suspense>
        </div>
      </div>
    </EditorProvider>
  );
}

function LayerOutline({ layer }: { layer: LayerNode }) {
  console.log(layer.readMetrics().graphicalBounds);
  const { graphicalBounds } = layer.readMetrics();
  const initialWidth =
    (graphicalBounds[1][0] - graphicalBounds[0][0]) *
    (1 / window.devicePixelRatio);
  const initialHeight =
    (graphicalBounds[1][1] - graphicalBounds[0][1]) *
    (1 / window.devicePixelRatio);

  const changeDimensionsHandler = useCallback(
    ({ width, height }: { width?: number; height?: number }) => {
      console.log(width, height);
      if (width && !height) {
        console.log("setting width, ", width);
        layer.setWidth(width);
      } else if (height && !width) {
        console.log("setting height, ", height);
        layer.setHeight(height);
      } else if (width && height) {
        console.log("setting both, ", width, height);
        layer.setSize(width, height);
      }
    },
    [layer],
  );

  return (
    <RelativeMarker node={layer}>
      <ResizeContainer
        onResize={changeDimensionsHandler}
        initialHeight={initialHeight}
        initialWidth={initialWidth}
        style={{
          border: "none",
        }}
      >
        <div className="border border-solid border-red-800 inset-0 absolute" />
        <ResizeWidthHandle />
        <ResizeHeightHandle />
        <ResizeBothHandle />
      </ResizeContainer>
    </RelativeMarker>
  );
}

function LayerOutlineNew({ layer }: { layer: LayerNode }) {
  console.log(layer.readMetrics().graphicalBounds);
  const { graphicalBounds } = layer.readMetrics();
  const initialWidth =
    (graphicalBounds[1][0] - graphicalBounds[0][0]) *
    (1 / window.devicePixelRatio);
  const initialHeight =
    (graphicalBounds[1][1] - graphicalBounds[0][1]) *
    (1 / window.devicePixelRatio);

  const changeDimensionsHandler = useCallback(
    (width, height) => {
      console.log("width, height", width, height);
      // width && layer.setWidth(width);
      // height && layer.setHeight(height);
      layer.setSize(width, height);
    },
    [layer],
  );

  return (
    <RelativeMarker node={layer}>
      <LayerMaskWrapper onResize={changeDimensionsHandler} />
    </RelativeMarker>
  );
}
