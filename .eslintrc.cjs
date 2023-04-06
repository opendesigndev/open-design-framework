module.exports = {
  extends: ["react-app", "prettier"],
  plugins: ["simple-import-sort", "prettier"],
  parserOptions: {
    project: [
      "./tsconfig.json",
      "packages/*/tsconfig.*.json",
      "packages/*/tsconfig.*",
      "packages/docs/*/tsconfig.json",
      "packages/docs/external/*/tsconfig.json",
    ],
  },
  rules: {
    "prettier/prettier": "error",
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      { prefer: "type-imports" },
    ],
    "@typescript-eslint/consistent-type-exports": "warn",
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    "no-loop-func": 0,
  },
  ignorePatterns: ["packages/**/dist/**/*", "**/*.js", "**/*.d.ts"],
  root: true,
};
