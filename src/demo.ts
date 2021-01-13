import "./styles.css";
import { TsPdfViewer } from "./ts-pdf-viewer";

async function run(): Promise<void> {  
  const viewer = new TsPdfViewer("#pdf-viewer-container", "assets/pdf.worker.min.js");
  console.log(viewer);

  await viewer.openPdfAsync("demo2.pdf");
} 

run();
