# ts-pdf 📄
<p align="left">
    <a href="https://www.npmjs.com/package/ts-pdf">
      <img src="https://img.shields.io/npm/v/ts-pdf" alt="Npm">
    </a>
    <a href="https://github.com/yermolim/ts-pdf/blob/master/LICENSE">
      <img src="https://img.shields.io/badge/license-AGPL-blue.svg?style=flat-round" alt="License">
    </a>
    <br>
</p>
A PDF.js-based PDF viewer written in TypeScript.

## Features
<ul>
    <li>opening and viewing PDF files</li>
    <li>adding and editing PDF annotations (supported annotation types are listed below)</li>
    <li>custom parsing and rendering for the supported annotation types</li>
    <li>annotation import/export to/from data-transfer objects that can be effortlessly serialized to JSON (useful for storing annotations in the separate database)</li>
    <li>compliance to the official PDF specification (v1.7)</li>
    <li>encrypted PDF-files support (supported encryption algorithms are listed below)</li>
    <li>responsive UI, friendly for touch devices</li>
    <li>easy color scheme customization using CSS variables to override the default values</li>
    <li>using Shadow DOM to minimize conflicts with outer HTML</li>
</ul>

<img src="https://raw.githubusercontent.com/yermolim/ts-pdf/main/gifs/main.gif" width="540" height="340">
<p float="left">
  <img src="https://raw.githubusercontent.com/yermolim/ts-pdf/main/gifs/mobile.gif" 
  width="180" height="320">
  <img src="https://raw.githubusercontent.com/yermolim/ts-pdf/main/gifs/mobile-annots.gif" width="180" height="320">
  <img src="https://raw.githubusercontent.com/yermolim/ts-pdf/main/gifs/text.gif" width="180" height="320">
</p>

## How it works in a nutshell
PDF file source data (decrypted if needed) is parsed using the custom parser written from scratch. 
Annotations of all the supported types are extracted from the source file. 
The resulting PDF file (without the supported annotations) is handled by the PDF.js worker, which is used to render the file contents and build a text layer. 
The extracted annotations are rendered to SVG on top of the pages by the custom PDF appearance stream renderer. 
User can modify or delete any supported annotation or add new annotations of the supported types by using provided UI. The annotations can be imported or exported at any time using corresponding methods. 
All changes are made can be saved to a new PDF file, which can be downloaded or returned to the caller as a byte array.

### Currently supported annotation types
<ul>
    <li>Ink annotation</li>
    <li>Stamp annotation</li>
    <li>Line annotation</li>
    <li>Square annotation</li>
    <li>Circle annotation</li>
    <li>Polygon annotation</li>
    <li>Polyline annotation</li>
    <li>Highlight annotation</li>
    <li>Underline annotation</li>
    <li>Squiggly annotation</li>
    <li>Strikeout annotation</li>
    <li>Text annotation (only note icon)</li>
    <li>Free text annotation</li>
</ul>

### Currently supported PDF encryption algorithms
<ul>
    <li>V1R2 (RC4 with 40-bit key)</li>
    <li>V2R3 (RC4 with 128-bit key)</li>
    <li>V4R4 (RC4 or AES with 128-bit key)</li>
</ul>

#### Yet to be implemented
<ul>
    <li>V5R5 (AES with 256-bit key)</li>
    <li>V5R6 (AES with 256-bit key, PDF 2.0)</li>
</ul>

### Currently supported PDF stream encoding algorithms
<ul>
    <li>Flate</li>
    <li>DCT</li>
    <li>JBIG2</li>
    <li>JPX</li>
</ul>

#### Not implemented yet
<ul>
    <li>LZW</li>
    <li>ASCII base-85</li>
    <li>ASCII hexadecimal</li>
    <li>CCITT</li>
    <li>Run-length</li>
</ul>


## Getting started

### Installation into your project
```
npm install ts-pdf
```

### Running the simplest example
```javascript
import { TsPdfViewer, TsPdfViewerOptions } from "ts-pdf";

async function run(): Promise<void> {  
  const options: TsPdfViewerOptions = {
    containerSelector: "#your-html-container-selector", 
    workerSource: "assets/pdf.worker.min.js", // path to the PDF.js worker script
    userName: "your_username",
    // you can check other properties using your editor hints
  };
  const viewer = new TsPdfViewer(options);
  await viewer.openPdfAsync("your_file.pdf");
} 

run();
```

#### ⚠️for viewer to function properly its container element must have relative, absolute or fixed position!

### Changing the color scheme

To apply a custom color scheme to the viewer, assign color values to the following CSS variables. Default values are used for omitted variables.
```css
:root {
  --tspdf-color-primary: rgba(77, 88, 115, 1);
  --tspdf-color-primary-tr: rgba(77, 88, 115, 0.9);
  --tspdf-color-secondary: rgb(113, 133, 150);
  --tspdf-color-secondary-tr: rgba(113, 133, 150, 0.9);
  --tspdf-color-accent: rgba(64, 72, 95, 1);
  --tspdf-color-shadow: rgba(0, 0, 0, 0.75);
  --tspdf-color-bg: rgba(128, 128, 128,1);
  --tspdf-color-fg-primary: rgba(255, 255, 255, 1);
  --tspdf-color-fg-secondary:rgba(187, 187, 187, 1);
  --tspdf-color-fg-accent: rgb(255, 204, 0);
  --tspdf-color-text-selection: rgba(104, 104, 128, 0.3);
}
```

### Solving Angular app compilation issue

When using this module inside an Angular app you can face the problem that your project is not compiling because of 'SyntaxError: Unexpected token'. The cause of such behavior is that Angular 11.x and lower use Webpack v4.x that does not support fluent null-check syntax ('?.'), which is present in 'pdfjs-dist' build. 
The easy solution is to replace 
```json
"main": "build/pdf.js" 
```
with 
```json
"main": "es5/build/pdf.js" 
```
inside 
```
"/node_modules/pdfjs-dist/package.json"
```
The other one is to make your own build of PDF.js.


## TODO list
<ul>
    <li><del>add ink annotations support</del> added in 0.1.0</li>
    <li><del>add geometric annotations (line, polyline, polygon, square, circle) support</del> added in 0.2.0</li>
    <li><del>add text markup annotations (underline, strikeout, highlight, squiggly) support</del> added in 0.4.0</li>
    <li><del>add text annotations (note) support</del> added in 0.4.0</li>
    <li><del>add page rotation support</del> added in 0.5.0</li>
    <li><del>add annotation blending modes support</del> added in 0.5.2</li>
    <li><del>add custom stamp annotations support</del> added in 0.6.0</li>
    <li><del>optimize loading and saving files</del> some optimizations were made in 0.6.2</li>
    <li><del>add text caption support for line annotations</del> added in 0.6.6</li>
    <li><del>add free text annotations support</del> added in 0.7.0</li>
    <li>add 'undo'/'redo'</li>
    <li>optimize parser and renderer</li>
    <li>add tooltips to buttons</li>
    <li>add keyboard shortcuts</li>
    <li>add more options for line annotations</li>
    <li>add more options for free text annotations</li>
    <li>add localizations</li>
    <li>write tests</li>
    <li>add support for the rest of encryption algorithms</li>
    <li>add support for the rest of encoding algorithms</li>
</ul>

## External dependencies:
<ul>
    <li><a href="https://github.com/mozilla/pdfjs-dist">PDF.js<a></li>
    <li><a href="https://github.com/entronad/crypto-es">CryptoES<a></li>
    <li><a href="https://github.com/nodeca/pako">pako<a></li>
    <li><a href="https://github.com/uuidjs/uuid">uuid<a></li>
</ul>
