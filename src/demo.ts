import { TsPdfViewer } from "./ts-pdf-viewer";

async function run(): Promise<void> {  
  const viewer = new TsPdfViewer("#pdf-main-container", "assets/pdf.worker.min.js");
  await viewer.openPdfAsync("demo-wps.pdf");

  // setTimeout(() => {
  //   viewer.closePdfAsync();
  // }, 5000);
  
  // setTimeout(() => {
  //   viewer.openPdfAsync("demo.pdf");
  // }, 10000);
} 

run();
