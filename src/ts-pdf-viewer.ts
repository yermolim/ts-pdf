import "./styles.css";
import { getDocument } from "pdfjs-dist";

export class TsPdfViewer {
  private _container: HTMLDivElement;

  private _viewCanvas: HTMLCanvasElement;

  constructor(containerSelector: string) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error("Container not found");
    } else if (!(container instanceof HTMLDivElement)) {
      throw new Error("Container is not a DIV element");
    } else {
      this._container = container;
    }

    this.initViewerGUI();
  }

  async openPdfAsync(path: string) {
    const doc = await getDocument(path).promise;
  }

  private initViewerGUI() {
    const canvas = document.createElement("canvas");

    this._viewCanvas = canvas;
  }

  private onContainerResize(size: { width: number; height: number }) {
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
  }
}
