import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage", "release", "node_modules"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: globals.node }
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: { projectService: true }
    }
  }
);
