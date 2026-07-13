import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/countries.ts", "src/address.ts", "src/phone.ts", "src/tax.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: false,
  clean: true,
  treeshake: true,
  minify: false,
});
