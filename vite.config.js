import { defineConfig } from "vite";
import monacoEditorPlugin from "vite-plugin-monaco-editor";

export default defineConfig({
  // plugins: [monacoEditorPlugin()],
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp", //require-corp
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
});
