import { terser } from "rollup-plugin-terser";
import css from "rollup-plugin-css-porter";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default [{
  input: "tsc/pdf-viewer.js",
  output: [
    { file: "dist/index.esm.js", format: "es" },
    { file: "dist/index.esm.min.js", format: "es", plugins: [terser()] },
    { file: "dist/index.umd.js", format: "umd", name: "TsPdfViewer" },
    { file: "dist/index.umd.min.js", format: "umd", name: "TsPdfViewer", plugins: [terser()] },
  ],
  plugins: [
    css({
      raw: "dist/styles.css",
      minified: "dist/styles.min.css",
    }),
    commonjs(),
    resolve({
      browser: true,
    }),
  ],
}];
