import "./index.css";

import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

import { Manual } from "./0-manual.js";
import { Minimal } from "./0-minimal.js";
import { Nested } from "./1-nested.js";
import { ErrorBoundary } from "./error-boundary.js";

const el = document.querySelector("#root")!;
const root = createRoot(el);
root.render(
  <BrowserRouter>
    <ErrorBoundary>
      <Routes>
        <Route element={<App />} index />
        <Route element={<Minimal />} path="/minimal" />
        <Route element={<Manual />} path="/manual" />
        <Route element={<Nested />} path="/nested" />
      </Routes>
    </ErrorBoundary>
  </BrowserRouter>
);

function App() {
  return (
    <div className="flex flex-col">
      <Link to="/minimal">minimal</Link>
      <Link to="/manual">manual</Link>
      <Link to="/nested">nested</Link>
    </div>
  );
}
