import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "src/index.ts" },
  outDir: "dist",
  format: "esm",
  platform: "neutral",
  target: "es2022",
  fixedExtension: false,
  clean: true,
  sourcemap: false,
  dts: { sourcemap: false },
  tsconfig: "./tsconfig.build.json",
});
