import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist/types/display/api";

import { html, styles } from "./ts-pdf-html";
import { clamp, Position } from "./ts-pdf-common";
import { TsPdfPage } from "./ts-pdf-page";

export class TsPdfViewer {
  private readonly _visibleAdjPages = 2;

  private readonly _minScale = 0.25;
  private readonly _maxScale = 4;
  private _scale = 1;

  private _container: HTMLDivElement;
  private _shadowRoot: ShadowRoot;
  private _viewerContainer: HTMLDivElement;

  private _pdfLoadingTask: PDFDocumentLoadingTask;
  private _pdfDocument: PDFDocumentProxy;

  private _pagesContainer: HTMLDivElement;
  private _pages: TsPdfPage[] = [];
  private _currentPage = 0;
  
  private _mousePos: Position;
  private _mouseInCenterTimer: number;
  private _panelsHidden: boolean;

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
    this._pdfLoadingTask?.destroy();
    this._pages.forEach(x => x.destroy());
    if (this._pdfDocument) {
      this._pdfDocument.cleanup();
      this._pdfDocument.destroy();
    }
    this._shadowRoot.innerHTML = "";
  }

  async openPdfAsync(src: string | Uint8Array): Promise<void> {
    if (this._pdfLoadingTask) {
      await this.closePdfAsync();
      return this.openPdfAsync(src);
    }

    const loadingTask = getDocument(src);
    this._pdfLoadingTask = loadingTask;
    loadingTask.onProgress = this.onPdfLoadingProgress;
    const doc = await loadingTask.promise;    
    this._pdfLoadingTask = null;

    await this.onPdfLoadedAsync(doc);
  }

  async closePdfAsync(): Promise<void> {
    if (this._pdfLoadingTask) {
      if (!this._pdfLoadingTask.destroyed) {
        await this._pdfLoadingTask.destroy();
      }
      this._pdfLoadingTask = null;
    }

    await this.onPdfClosedAsync();
  }

  private initViewerGUI() {
    this._shadowRoot = this._container.attachShadow({mode: "open"});
    this._shadowRoot.innerHTML = styles + html;

    const paginatorInput = this._shadowRoot.getElementById("paginator-input") as HTMLInputElement;
    paginatorInput.addEventListener("input", this.onPaginatorInput);
    paginatorInput.addEventListener("change", this.onPaginatorChange);    
    this._shadowRoot.querySelector("div#paginator-prev").addEventListener("click", this.onPaginatorPrevClick);
    this._shadowRoot.querySelector("div#paginator-next").addEventListener("click", this.onPaginatorNextClick);

    this._shadowRoot.querySelector("div#zoom-out").addEventListener("click", this.onZoomOutClick);
    this._shadowRoot.querySelector("div#zoom-in").addEventListener("click", this.onZoomInClick);
    this._shadowRoot.querySelector("div#zoom-fit-viewer").addEventListener("click", this.onZoomFitViewerClick);
    this._shadowRoot.querySelector("div#zoom-fit-page").addEventListener("click", this.onZoomFitPageClick);

    this._pagesContainer = this._shadowRoot.querySelector("div#pages-container");
    this._pagesContainer.addEventListener("scroll", this.onPagesContainerScroll);
    this._pagesContainer.addEventListener("wheel", this.onPagesContainerWheel);
    this._pagesContainer.addEventListener("mousemove", this.onPagesContainerMouseMove);

    this._viewerContainer = this._shadowRoot.querySelector("div#viewer-container");
  }

  private onPdfLoadingProgress = (progressData: { loaded: number; total: number }) => {
    console.log(`${progressData.loaded}/${progressData.total}`);
  };

  private onPdfLoadedAsync = async (doc: PDFDocumentProxy) => {
    this._pdfDocument = doc;
    await this.refreshPagesAsync();
    await this.renderVisiblePagesAsync();
  };

  private onPdfClosedAsync = async () => {
    if (this._pdfDocument) {
      this._pdfDocument = null;
    }
    await this.refreshPagesAsync();
  };

  private async refreshPagesAsync(): Promise<void> { 
    this._pages.forEach(x => {
      x.container.remove();
    });
    this._pages.length = 0;

    const docPagesNumber = this._pdfDocument.numPages;
    this._shadowRoot.getElementById("paginator-total").innerHTML = docPagesNumber + "";

    for (let i = 0; i < docPagesNumber; i++) {
      const page = new TsPdfPage(this._maxScale);      
      const pageProxy = await this._pdfDocument.getPage(i + 1);
      page.pageProxy = pageProxy;
      page.scale = this._scale;

      this._pages.push(page);
      this._pagesContainer.append(page.container);
    } 
  }

  private async renderVisiblePagesAsync(): Promise<void> {
    const pages = this._pages;
    const visiblePageNumbers = this.getVisiblePages(this._container, pages); 

    this._currentPage = this.getCurrentPage(this._container, pages, visiblePageNumbers);
    (<HTMLInputElement>this._shadowRoot.getElementById("paginator-input")).value = this._currentPage + 1 + "";

    const minPageNumber = Math.max(Math.min(...visiblePageNumbers) - this._visibleAdjPages, 0);
    const maxPageNumber = Math.min(Math.max(...visiblePageNumbers) + this._visibleAdjPages, pages.length - 1);
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (i >= minPageNumber && i <= maxPageNumber) {
        if (!page.isValid) {
          await page.renderAsync();
        }
      } else {
        page.clear();
      }
    } 
  }  

  private scrollToPage(pageNumber: number) { 
    const {top: cTop} = this._pagesContainer.getBoundingClientRect();
    const {top: pTop} = this._pages[pageNumber].container.getBoundingClientRect();

    const scroll = pTop - (cTop - this._pagesContainer.scrollTop);
    this._pagesContainer.scrollTo(this._pagesContainer.scrollLeft, scroll);
  }

  //#region zooming
  private async setScaleAsync(scale: number, cursorPosition: Position = null): Promise<void> {
    if (!scale || scale === this._scale) {
      return;
    }

    let pageContainerUnderPivot: HTMLElement;
    let xPageRatio: number;
    let yPageRatio: number;

    if (cursorPosition) {
      for (const page of this._pages) {
        const {clientX: x, clientY: y} = cursorPosition;
        const {x: pX, y: pY, width: pWidth, height: pHeight} = page.container.getBoundingClientRect();
        // get page under cursor
        if (pX <= x 
          && pX + pWidth >= x
          && pY <= y
          && pY + pHeight >= y) {          
          // get cursor position relative to page dimensions before scaling
          pageContainerUnderPivot = page.container;
          xPageRatio = (x - pX) / pWidth;
          yPageRatio = (y - pY) / pHeight;          
          break;
        }
      }
    }

    this._scale = scale;
    this._pages.forEach(x => x.scale = this._scale);  
    
    if (pageContainerUnderPivot) {   
      // get the position of the point under cursor after scaling   
      const {clientX: initialX, clientY: initialY} = cursorPosition;
      const {x: pX, y: pY, width: pWidth, height: pHeight} = pageContainerUnderPivot.getBoundingClientRect();
      const resultX = pX + (pWidth * xPageRatio);
      const resultY = pY + (pHeight * yPageRatio);

      // scroll page to move the point to its initial position in the viewport
      const scrollLeft = this._pagesContainer.scrollLeft + (resultX - initialX);
      const scrollTop = this._pagesContainer.scrollTop + (resultY - initialY);
      this._pagesContainer.scrollTo(scrollLeft, scrollTop);
      // render will be called from the scroll event handler so no need to call it from here
      return;
    }
    
    await this.renderVisiblePagesAsync();
  }

  private async zoomOut(cursorPosition: Position = null): Promise<void> {
    const scale = clamp(this._scale - 0.25, this._minScale, this._maxScale);
    await this.setScaleAsync(scale, cursorPosition);
  }
  
  private async zoomIn(cursorPosition: Position = null): Promise<void> {
    const scale = clamp(this._scale + 0.25, this._minScale, this._maxScale);
    await this.setScaleAsync(scale, cursorPosition);
  }
  //#endregion
  
  //#region event handlers
  private onPagesContainerScroll = () => {
    this.renderVisiblePagesAsync();
  };
  
  private onPagesContainerMouseMove = (event: MouseEvent) => {
    const {clientX, clientY} = event;
    const {x: rectX, y: rectY, width, height} = this._pagesContainer.getBoundingClientRect();

    const l = clientX - rectX;
    const t = clientY - rectY;
    const r = width - l;
    const b = height - t;

    console.log(Math.min(l, r, t, b));

    if (Math.min(l, r, t, b) > 100) {
      if (!this._panelsHidden && !this._mouseInCenterTimer) {
        this._mouseInCenterTimer = setTimeout(() => {
          this._viewerContainer.classList.add("hide-panels");
          this._panelsHidden = true;
          this._mouseInCenterTimer = null;
        }, 5000);
      }      
    } else {
      if (this._mouseInCenterTimer) {
        clearTimeout(this._mouseInCenterTimer);
        this._mouseInCenterTimer = null;
      }
      if (this._panelsHidden) {        
        this._viewerContainer.classList.remove("hide-panels");
        this._panelsHidden = false;
      }
    }

    this._mousePos = {clientX, clientY, containerX: l, containerY: t};
  };
  
  private onPagesContainerWheel = (event: WheelEvent) => {
    if (event.ctrlKey) {
      event.preventDefault();
      if (event.deltaY > 0) {
        this.zoomOut(this._mousePos);
      } else {
        this.zoomIn(this._mousePos);
      }
    }
  };

  private onPaginatorInput = (event: Event) => {
    if (event.target instanceof HTMLInputElement) {
      event.target.value = event.target.value.replace(/[^\d]+/g, "");
    }
  };
  
  private onPaginatorChange = (event: Event) => {
    if (event.target instanceof HTMLInputElement) {
      const pageNumber = Math.max(Math.min(+event.target.value, this._pdfDocument.numPages), 1);
      if (pageNumber + "" !== event.target.value) {        
        event.target.value = pageNumber + "";
      }
      this.scrollToPage(pageNumber - 1);
    }
  };
  
  private onPaginatorPrevClick = () => {
    const pageNumber = clamp(this._currentPage - 1, 0, this._pages.length - 1);
    this.scrollToPage(pageNumber);
  };

  private onPaginatorNextClick = () => {
    const pageNumber = clamp(this._currentPage + 1, 0, this._pages.length - 1);
    this.scrollToPage(pageNumber);
  };

  private onZoomOutClick = () => {
    this.zoomOut();
  };

  private onZoomInClick = () => {
    this.zoomIn();
  };
  
  private onZoomFitViewerClick = () => {
    const cWidth = this._pagesContainer.getBoundingClientRect().width;
    const pWidth = this._pages[this._currentPage].container.getBoundingClientRect().width;
    const scale = clamp((cWidth  - 20) / pWidth * this._scale, this._minScale, this._maxScale);
    this.setScaleAsync(scale);
  };
  
  private onZoomFitPageClick = () => {
    const { width: cWidth, height: cHeight } = this._pagesContainer.getBoundingClientRect();
    const { width: pWidth, height: pHeight } = this._pages[this._currentPage].container.getBoundingClientRect();
    const hScale = clamp((cWidth - 20) / pWidth * this._scale, this._minScale, this._maxScale);
    const vScale = clamp((cHeight - 20) / pHeight * this._scale, this._minScale, this._maxScale);
    this.setScaleAsync(Math.min(hScale, vScale));
  };

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

  //#endregion
  

  //#region page numbers methods
  private getVisiblePages(container: HTMLDivElement, pages: TsPdfPage[]): Set<number> {
    const cRect = container.getBoundingClientRect();
    const cTop = cRect.top;
    const cBottom = cRect.top + cRect.height;

    const pagesVisible = new Set<number>();
    pages.forEach((x, i) => {
      const pRect = x.container.getBoundingClientRect();
      const pTop = pRect.top;
      const pBottom = pRect.top + pRect.height;

      if (pTop < cBottom && pBottom > cTop) {
        pagesVisible.add(i);
      }
    });
    return pagesVisible;
  }
  
  private getCurrentPage(container: HTMLDivElement, pages: TsPdfPage[], visiblePageNumbers: Set<number>): number {
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
      const pRect = pages[i].container.getBoundingClientRect();
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
  //#endregion
}
