import { TsPdfViewer } from "./ts-pdf-viewer";

async function run(): Promise<void> {  
  const viewer = new TsPdfViewer("#pdf-main-container", "assets/pdf.worker.min.js");
  // await viewer.openPdfAsync("demo.pdf");
  // await viewer.openPdfAsync("demo-acad.pdf");
  // await viewer.openPdfAsync("demo-adobe.pdf");
  // await viewer.openPdfAsync("demo-large.pdf");
  // await viewer.openPdfAsync("demo-wordpdf");
  // await viewer.openPdfAsync("demo-wps.pdf");
  // await viewer.openPdfAsync("demo-v1r2.pdf");
  // await viewer.openPdfAsync("demo-v2r3.pdf");
  // await viewer.openPdfAsync("demo-v4r4-v2.pdf");
  await viewer.openPdfAsync("demo-v4r4-aesv2.pdf");
  // await viewer.openPdfAsync("demo-v5r5-aesv3.pdf");
  // await viewer.openPdfAsync("demo-v5r6-aesv3.pdf");

  // setTimeout(() => {
  //   viewer.closePdfAsync();
  // }, 5000);
  
  // setTimeout(() => {
  //   viewer.openPdfAsync("demo.pdf");
  // }, 10000);
} 

run();
