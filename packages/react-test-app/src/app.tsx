import "./index.css";

import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Link,
  Route,
  RouterProvider,
} from "react-router-dom";

import { Manual } from "./0-manual.js";
import { Minimal } from "./0-minimal.js";
import { Nested } from "./1-nested.js";
import { RouteError } from "./error-boundary.js";
import { Import, loader as importLoader } from "./import.js";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" errorElement={<RouteError />}>
      <Route element={<Index />} index />
      <Route element={<Minimal />} path="/minimal" />
      <Route element={<Manual />} path="/manual" />
      <Route element={<Nested />} path="/nested" />
      <Route element={<Import />} path="/import" loader={importLoader} />
    </Route>
  )
);

export function App() {
  return <RouterProvider router={router} />;
}
function Index() {
  return (
    <div className="flex flex-col">
      <a href="/modules.html">API docs</a>
      <a href="/changelog.html">Changelog</a>
      <Link to="/minimal">minimal</Link>
      <Link to="/manual">manual</Link>
      <Link to="/nested">nested</Link>
      <Link to="/import">import</Link>
    </div>
  );
}
