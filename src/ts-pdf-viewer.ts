import "./styles.css";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, RenderParameters } from "pdfjs-dist/types/display/api";
import { TsPdfConst } from "./ts-pdf-const";
import { getRandomUuid } from "./ts-pdf-common";

interface PageCanvas {
  canvas: HTMLCanvasElement; 
  ctx: CanvasRenderingContext2D; 
  renderTask: {cancel: () => void}; 
  rendered: boolean;
}

export class TsPdfViewer {
  private readonly _visibleAdjPages = 2;

  private _container: HTMLDivElement;
  private _viewerContainer: HTMLDivElement;

  private _pdfLoadingTask: PDFDocumentLoadingTask;
  private _pdfDocument: PDFDocumentProxy;

  private _pagesContainer: HTMLDivElement;
  private _pageCanvases: PageCanvas[] = [];

  private _pagesVisible = new Set<number>();
  private _pageCurrent: number;

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

  destroy() {
    // TODO: add disposal logic
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
      if (!this._pdfLoadingTask.destroyed) {
        await this._pdfLoadingTask.destroy();
      }
      this._pdfLoadingTask = null;
    }

    if (this._pdfDocument) {
      this._pdfDocument = null;
    }

    this.refreshPageCanvases();
  }

  private initViewerGUI() {
    const viewerContainer = document.createElement("div");
    viewerContainer.classList.add(TsPdfConst.V_CONTAINER_CLASS);

    const pagesContainer = document.createElement("div");
    pagesContainer.classList.add(TsPdfConst.P_CONTAINER_CLASS);

    const topPanel = document.createElement("div");
    topPanel.classList.add(TsPdfConst.V_PANEL_TOP_CLASS);
    
    const bottomPanel = document.createElement("div");
    bottomPanel.classList.add(TsPdfConst.V_PANEL_BOTTOM_CLASS);

    const paginator = document.createElement("div");
    const pageInput = document.createElement("input");
    pageInput.setAttribute("type", "text");
    pageInput.addEventListener("input", () => {
      console.log(pageInput.value);
      pageInput.value = pageInput.value.replace(/[^\d]+/g, "");
    });
    pageInput.addEventListener("change", () => {
      console.log("CHANGED");
      console.log(pageInput.value);
    });
    // const currentPagePuuid = getRandomUuid();
    // const currentPageP = document.createElement("p");
    // currentPageP.classList.add(TsPdfConst.V_CURRENT_PAGE_CLASS);
    // currentPageP.id = currentPagePuuid;

    paginator.append(pageInput);
    bottomPanel.append(paginator);

    viewerContainer.append(topPanel);
    viewerContainer.append(pagesContainer);
    viewerContainer.append(bottomPanel);
    this._container.append(viewerContainer);

    this._viewerContainer = viewerContainer;
    this._pagesContainer = pagesContainer;
    
    // setTimeout(() => viewerContainer.classList.add(TsPdfConst.V_CONTAINER_HIDE_PANELS_CLASS), 3000);
    // setTimeout(() => viewerContainer.classList.remove(TsPdfConst.V_CONTAINER_HIDE_PANELS_CLASS), 6000);
  }

  // private onContainerResize = (size: { width: number; height: number }) => {
  //   if (!size) {
  //     const containerRect = this._container.getBoundingClientRect();
  //     size = { 
  //       width: containerRect.width,
  //       height: containerRect.height,
  //     };
  //   }
  //   const dpr = window.devicePixelRatio;
  //   this._canvas.width = size.width * dpr;
  //   this._canvas.height = size.height * dpr;
  // };

  private onPdfLoadingProgress = (progressData: { loaded: number; total: number }) => {
    console.log(`${progressData.loaded}/${progressData.total}`);
  };

  private onPdfLoaded = (doc: PDFDocumentProxy) => {
    this._pdfDocument = doc;   
    this.refreshPageCanvases();
    this.refreshPageView();
  };

  private refreshPageCanvases() { 
    this._pageCanvases.forEach(x => {
      x.canvas.remove();
    });
    this._pageCanvases.length = 0;

    const docPagesNumber = this._pdfDocument?.numPages;
    if (!docPagesNumber) {
      this._pagesContainer.removeEventListener("scroll", this.refreshPageView);
    }

    for (let i = 0; i < docPagesNumber; i++) {
      const canvas = document.createElement("canvas");
      canvas.classList.add(TsPdfConst.P_CANVAS_CLASS);
      canvas.height = 500;
      this._pagesContainer.append(canvas);
      this._pageCanvases.push({
        canvas, 
        ctx: canvas.getContext("2d"), 
        rendered: false, 
        renderTask: null,
      });
    }
    this._pagesContainer.addEventListener("scroll", this.refreshPageView);
  }

  private async renderVisiblePagesAsync() {
    const doc = this._pdfDocument;
    const pageCanvases = this._pageCanvases;
    const visiblePages = this._pagesVisible;

    const minPageNumber = Math.max(Math.min(...visiblePages) - this._visibleAdjPages, 0);
    const maxPageNumber = Math.min(Math.max(...visiblePages) + this._visibleAdjPages, pageCanvases.length - 1);
    
    for (let i = 0; i < pageCanvases.length; i++) {
      if (i >= minPageNumber && i <= maxPageNumber) {
        if (!pageCanvases[i].rendered) {
          await this.renderPageAsync(doc, pageCanvases, i);
        }
      } else if (pageCanvases[i].rendered) {
        this.clearRenderedPage(pageCanvases, i);
      }
    } 
  }

  private refreshPageView = () => {
    this._pagesVisible = this.getVisiblePages(this._container, this._pageCanvases);
    this._pageCurrent = this.getCurrentPage(this._container, this._pageCanvases, this._pagesVisible);
    this.renderVisiblePagesAsync();
  };

  

  private getVisiblePages(container: HTMLDivElement, pageCanvases: PageCanvas[]): Set<number> {
    const cRect = container.getBoundingClientRect();
    const cTop = cRect.top;
    const cBottom = cRect.top + cRect.height;

    const pagesVisible = new Set<number>();
    pageCanvases.forEach((x, i) => {
      const pRect = x.canvas.getBoundingClientRect();
      const pTop = pRect.top;
      const pBottom = pRect.top + pRect.height;

      if (pTop < cBottom && pBottom > cTop) {
        pagesVisible.add(i);
      }
    });
    return pagesVisible;
  }
  
  private getCurrentPage(container: HTMLDivElement, pageCanvases: PageCanvas[], visiblePageNumbers: Set<number>): number {
    const visiblePageNumbersArray = [...visiblePageNumbers];
    if (!visiblePageNumbersArray.length) {
      return 0;
    } else if (visiblePageNumbersArray.length === 1) {
      return visiblePageNumbersArray[0];
    }

    const cRect = container.getBoundingClientRect();
    const cTop = cRect.top;
    const cMiddle = cRect.top + cRect.height / 2;

    for (const i of visiblePageNumbersArray) {
      const pRect = pageCanvases[i].canvas.getBoundingClientRect();
      const pTop = pRect.top;

      if (pTop > cTop) {
        if (pTop > cMiddle) {
          return i - 1;
        } else {
          return i;
        }
      }
    };

    // function should not reach this point with correct arguments
    throw new Error("Incorrect argument");
  }

  private async renderPageAsync(doc: PDFDocumentProxy, pageCanvases: PageCanvas[], pageNumber: number, scale = 1) {  
    const pageCanvas = pageCanvases[pageNumber];    
    if (pageCanvas.renderTask) {
      return;
    }

    const page = await doc.getPage(pageNumber + 1);
    const viewport = page.getViewport({scale});
    pageCanvas.canvas.width = viewport.width;
    pageCanvas.canvas.height = viewport.height;
    
    if (!pageCanvas.renderTask) {
      // create new render task only if there is no pending one
      const params = <RenderParameters>{
        canvasContext: pageCanvas.ctx,
        viewport,
      };
      const renderTask = page.render(params);
      pageCanvas.renderTask = renderTask;
      await renderTask.promise;
      pageCanvas.renderTask = null;
      pageCanvas.rendered = true;
    }
  }

  private clearRenderedPage(pageCanvases: PageCanvas[], pageNumber: number) { 
    const pageCanvas = pageCanvases[pageNumber];
    pageCanvas.ctx.clearRect(0, 0, pageCanvas.canvas.width, pageCanvas.canvas.height);
    pageCanvas.rendered = false;
  }
}
