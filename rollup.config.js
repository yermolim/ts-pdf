import { terser } from "rollup-plugin-terser";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import image from "@rollup/plugin-image";
import commonjs from "@rollup/plugin-commonjs";
import externals from "rollup-plugin-node-externals";
// import css from "rollup-plugin-css-porter";

export default [
  // main build
  {
    input: "tsc/src/ts-pdf-viewer.js",
    output: [
      { file: "dist/ts-pdf-viewer.esm.js", format: "es" },
      { file: "dist/ts-pdf-viewer.esm.min.js", format: "es", plugins: [terser()] },
    ],
    plugins: [
      externals({
        deps: true,
        devDeps: false,
      }),
      image(),
      // css({
      //   raw: "dist/styles.css",
      //   minified: "dist/styles.min.css",
      // }),
    ],
  },
  // demo build
  {
    input: "tsc/src/demo.js",
    output: [
      { file: "demo/demo.js", format: "es" },
    ],
    plugins: [
      nodeResolve({
        browser: true,
      }),
      commonjs(),
      image(),
      // css({
      //   raw: "demo/styles.css",
      //   minified: false
      //   minified: "demo/styles.min.css",
      // }),
    ],
  },
];
