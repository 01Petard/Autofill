import { build } from "vite";
import { resolve } from "node:path";

const root = process.cwd();

await build({
  root,
  publicDir: resolve(root, "public"),
  build: {
    outDir: resolve(root, "dist"),
    emptyOutDir: true,
    sourcemap: false,
    modulePreload: false,
    rollupOptions: {
      input: {
        popup: resolve(root, "popup/index.html"),
        settings: resolve(root, "settings/index.html"),
        background: resolve(root, "src/background/index.ts")
      },
      output: {
        entryFileNames: (chunk) => chunk.name === "background" ? "background.js" : "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});

await build({
  root,
  publicDir: false,
  build: {
    outDir: resolve(root, "dist"),
    emptyOutDir: false,
    sourcemap: false,
    lib: {
      entry: resolve(root, "src/content/index.ts"),
      name: "AutofillContent",
      formats: ["iife"],
      fileName: () => "content.js"
    }
  }
});
