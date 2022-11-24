import "./index.css";

import { createRoot } from "react-dom/client";

import { App } from "./app.js";

const el = document.querySelector("#root")!;
const root = createRoot(el);
root.render(<App />);
