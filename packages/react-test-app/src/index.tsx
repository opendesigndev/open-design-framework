import { createRoot } from "react-dom/client";

const el = document.createElement("div");
document.body.appendChild(el);
const root = createRoot(el);
root.render(<div>Hello world!</div>);
