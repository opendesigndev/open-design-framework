import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

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
        <Route element={<Nested />} path="/nested" />
      </Routes>
    </ErrorBoundary>
  </BrowserRouter>
);

function App() {
  return (
    <>
      <Link to="/minimal">minimal</Link>
      <Link to="/nested">nested</Link>
    </>
  );
}
