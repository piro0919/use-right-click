import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  external: ["react"],
  // esbuild drops a "use client" it finds inside a file, so the banner puts it
  // back. Leave treeshake off: its pass drops the banner too.
  banner: { js: '"use client";' },
  tsconfig: "tsconfig.build.json",
});
