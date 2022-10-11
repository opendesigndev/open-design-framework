import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { Minimal } from "./0-minimal.js";

const el = document.createElement("div");
document.body.appendChild(el);
const root = createRoot(el);
root.render(
  <BrowserRouter>
    <Routes>
      <Route element={<App />} index />
      <Route element={<Minimal />} path="/minimal" />
    </Routes>
  </BrowserRouter>
);

function App() {
  return (
    <>
      <Link to="/minimal">minimal</Link>
    </>
  );
}
