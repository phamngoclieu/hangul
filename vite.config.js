import { defineConfig } from "vite";

export default defineConfig({
  root: "app",
  envDir: "..",
  base: "/hangul/",
  publicDir: "public",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    assetsDir: "assets",
    sourcemap: false
  }
});
