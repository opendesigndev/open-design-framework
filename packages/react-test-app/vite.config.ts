import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function dedefault<T>(v: { default: T }): T {
  // this is technically wrong typescript-wise, but will return proper error once
  // the dependency becomes "type": "module"
  return "default" in v ? v.default : (v as any);
}

export default defineConfig({
  plugins: [dedefault(react)()],
});
