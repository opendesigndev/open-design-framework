module.exports = {
  extends: ["react-app", "prettier"],
  plugins: ["simple-import-sort"],
  parserOptions: {
    project: [
      "./tsconfig.json",
      "packages/*/tsconfig.*",
      "packages/docs/*/tsconfig.json",
      "packages/docs/external/*/tsconfig.json",
    ],
  },
  rules: {
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      { prefer: "type-imports" },
    ],
    "@typescript-eslint/consistent-type-exports": "warn",
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    "no-loop-func": 0,
  },
  ignorePatterns: ["packages/*/dist/**/*"],
  root: true,
};
