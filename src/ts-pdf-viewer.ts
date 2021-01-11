import "./styles.css";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist/types/display/api";

export class TsPdfViewer {
  private _container: HTMLDivElement;

  private _viewCanvas: HTMLCanvasElement;

  private _pdfLoadingTask: PDFDocumentLoadingTask;
  private _pdfDocument: PDFDocumentProxy;

  constructor(containerSelector: string, workerSrc: string) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error("Container not found");
    } else if (!(container instanceof HTMLDivElement)) {
      throw new Error("Container is not a DIV element");
    } else {
      this._container = container;
    }
    
    if (!workerSrc) {
      throw new Error("Worker source path not defined");
    }
    GlobalWorkerOptions.workerSrc = workerSrc;

    this.initViewerGUI();
  }

  async openPdfAsync(path: string): Promise<void> {
    if (this._pdfLoadingTask) {
      await this.closePdfAsync();
      return this.openPdfAsync(path);
    }

    const loadingTask = getDocument(path);
    this._pdfLoadingTask = loadingTask;
    loadingTask.onProgress = this.onPdfLoadingProgress;
    const doc = await loadingTask.promise;    
    this._pdfLoadingTask = null;
    this.onPdfLoaded(doc);
  }

  async closePdfAsync(): Promise<void> {
    if (this._pdfLoadingTask) {
      await this._pdfLoadingTask.destroy();
      this._pdfLoadingTask = null;
    }

    if (this._pdfDocument) {
      this._pdfDocument = null;
    }
  }

  private initViewerGUI() {
    const canvas = document.createElement("canvas");

    this._viewCanvas = canvas;
  }

  private onContainerResize = (size: { width: number; height: number }) => {
    if (!size) {
      const containerRect = this._container.getBoundingClientRect();
      size = { 
        width: containerRect.width,
        height: containerRect.height,
      };
    }
    const dpr = window.devicePixelRatio;
    this._viewCanvas.width = size.width * dpr;
    this._viewCanvas.height = size.height * dpr;
  };

  private onPdfLoadingProgress = (progressData: { loaded: number; total: number }) => {
    console.log(`${progressData.loaded}/${progressData.total}`);
  };

  private onPdfLoaded = (doc: PDFDocumentProxy) => {    
    this._pdfDocument = doc;
    console.log(doc);
  };
}
