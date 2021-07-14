import license from "rollup-plugin-license";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import image from "@rollup/plugin-image";
import commonjs from "@rollup/plugin-commonjs";
import externals from "rollup-plugin-node-externals";
// import { terser } from "rollup-plugin-terser";
// import css from "rollup-plugin-css-porter";

export default [
  // main build
  {
    input: "tsc/src/ts-pdf.js",
    output: [
      { file: "dist/ts-pdf.esm.js", format: "esm" },
      // TODO: configure terser to prevent imports from shadowing variables
      // { file: "dist/ts-pdf.esm.min.js", format: "esm", plugins: [terser()] },
    ],
    plugins: [
      license({
        banner: `
          A PDF.js-based PDF viewer written in TypeScript.
          Copyright (C) 2021-present, Volodymyr Yermolenko (yermolim@gmail.com)
      
          This program is free software: you can redistribute it and/or modify
          it under the terms of the GNU Affero General Public License as published
          by the Free Software Foundation, either version 3 of the License, or
          (at your option) any later version.
      
          This program is distributed in the hope that it will be useful,
          but WITHOUT ANY WARRANTY; without even the implied warranty of
          MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
          GNU Affero General Public License for more details.
      
          You should have received a copy of the GNU Affero General Public License
          along with this program.  If not, see <https://www.gnu.org/licenses/>.

          -//-//-//-//-//-//-//-//-//-//-//-//-//-//-
          
          FlateStream class is based on the corresponding one from PDF.js, 
          so the code of that class is also subject to the next license notice:
          
          Copyright 2012 Mozilla Foundation

          Licensed under the Apache License, Version 2.0 (the "License");
          you may not use this file except in compliance with the License.
          You may obtain a copy of the License at
          
          http://www.apache.org/licenses/LICENSE-2.0
          
          Unless required by applicable law or agreed to in writing, software
          distributed under the License is distributed on an "AS IS" BASIS,
          WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
          See the License for the specific language governing permissions and
          limitations under the License.

          Copyright 1996-2003 Glyph & Cog, LLC
          
          The flate stream implementation contained in this file is a JavaScript port
          of XPDF's implementation, made available under the Apache 2.0 open source
          license.

          -//-//-//-//-//-//-//-//-//-//-//-//-//-//-
        `,
      }),
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
      { file: "demo/demo.js", format: "esm" },
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
