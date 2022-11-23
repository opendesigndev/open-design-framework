import { importFile } from "@opendesign/universal";
import saveAs from "file-saver";
import { useLoaderData } from "react-router-dom";

export async function loader() {
  // Load example file. Please note that it is hand-modified file so that we do
  // not have large files in the repo.
  const res = await fetch("/static/file-reduced.xd");
  const data = new Uint8Array(await res.arrayBuffer());
  return importFile(data);
}

export function Import() {
  const data: Awaited<ReturnType<typeof loader>> = useLoaderData() as any;
  return (
    <div>
      Hello
      <button
        onClick={() => {
          saveAs(new Blob([data]), "file.octopus");
        }}
      >
        Download
      </button>
    </div>
  );
}
