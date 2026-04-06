import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "error",
    },
  },
  {
    ignores: [
      "node_modules/**",
      "**/node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "**/*.min.js",
      "tests/**/*.js",
    ],
  }
);
