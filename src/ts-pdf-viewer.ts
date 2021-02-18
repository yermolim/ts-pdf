import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist/types/display/api";

import { html, styles } from "./assets/index.html";
import { clamp, getCenter, getDistance, Position } from "./common";
import { ViewPage } from "./view-page";
import { AnnotationEditor } from "./document/annotation-editor";

type ViewerMode = "normal" | "hand";

export class TsPdfViewer {
  private readonly _visibleAdjPages = 0;
  private readonly _previewWidth = 100;
  private readonly _minScale = 0.25;
  private readonly _maxScale = 4;
  private _scale = 1;

  private _outerContainer: HTMLDivElement;
  private _shadowRoot: ShadowRoot;

  private _mainContainer: HTMLDivElement;
  private _mainContainerResizeObserver: ResizeObserver;

  private _pdfLoadingTask: PDFDocumentLoadingTask;
  private _pdfDocument: PDFDocumentProxy;

  private _previewer: HTMLDivElement;
  private _viewer: HTMLDivElement;
  
  private _panelsHidden: boolean;
  private _previewerHidden = true;

  private _pages: ViewPage[] = [];
  private _currentPage = 0;

  private _mode: ViewerMode = "normal";
  
  private _pointerInfo = {
    lastPos: <Position>null,
    downPos: <Position>null,
    downScroll: <Position>null, 
  };
  private _timers = {    
    hidePanels: 0,
  };
  private _pinchInfo = {
    active: false,
    lastDist: 0,
    minDist: 10,
    sensitivity: 0.025,
    target: <HTMLElement>null,
  };

  constructor(containerSelector: string, workerSrc: string) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error("Container not found");
    } else if (!(container instanceof HTMLDivElement)) {
      throw new Error("Container is not a DIV element");
    } else {
      this._outerContainer = container;
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

    this._mainContainerResizeObserver?.disconnect();
    this._shadowRoot.innerHTML = "";
  }

  async openPdfAsync(src: string | Blob | Uint8Array): Promise<void> {
    let data: Uint8Array;
    let doc: PDFDocumentProxy;

    try {
      if (src instanceof Uint8Array) {
        data = src;
      } else {
        let blob: Blob;  
        if (typeof src === "string") {
          const res = await fetch(src);
          blob = await res.blob();
        } else {
          blob = src;
        }
  
        const buffer = await blob.arrayBuffer();
        data = new Uint8Array(buffer);
      }
    } catch {
      throw new Error("Cannot load file data!");
    }

    const annotator = new AnnotationEditor(data);
    let password: string;
    while (true) {      
      const authenticated = annotator.tryAuthenticate(password);
      if (!authenticated) {
        password = "ownerpassword";
        continue;
        // TODO: add user dialog
      }
      break;
    }

    // data without supported annotations
    data = annotator.getRefinedData();

    try {
      if (this._pdfLoadingTask) {
        await this.closePdfAsync();
        return this.openPdfAsync(data);
      }
  
      this._pdfLoadingTask = getDocument({data, password});
      this._pdfLoadingTask.onProgress = this.onPdfLoadingProgress;
      doc = await this._pdfLoadingTask.promise;    
      this._pdfLoadingTask = null;
    } catch (e) {
      throw new Error(`Cannot open PDF: ${e.message}`);
    }

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
    this._shadowRoot = this._outerContainer.attachShadow({mode: "open"});
    this._shadowRoot.innerHTML = styles + html;

    const paginatorInput = this._shadowRoot.getElementById("paginator-input") as HTMLInputElement;
    paginatorInput.addEventListener("input", this.onPaginatorInput);
    paginatorInput.addEventListener("change", this.onPaginatorChange);    
    this._shadowRoot.querySelector("#paginator-prev").addEventListener("click", this.onPaginatorPrevClick);
    this._shadowRoot.querySelector("#paginator-next").addEventListener("click", this.onPaginatorNextClick);

    this._shadowRoot.querySelector("#zoom-out").addEventListener("click", this.onZoomOutClick);
    this._shadowRoot.querySelector("#zoom-in").addEventListener("click", this.onZoomInClick);
    this._shadowRoot.querySelector("#zoom-fit-viewer").addEventListener("click", this.onZoomFitViewerClick);
    this._shadowRoot.querySelector("#zoom-fit-page").addEventListener("click", this.onZoomFitPageClick);

    this._shadowRoot.querySelector("div#toggle-previewer").addEventListener("click", this.onPreviewerToggleClick);
    this._shadowRoot.querySelector("div#toggle-hand").addEventListener("click", this.onHandToggleClick);

    this._previewer = this._shadowRoot.querySelector("div#previewer");
    this._previewer.addEventListener("scroll", this.onPreviewerScroll);
    this._viewer = this._shadowRoot.querySelector("div#viewer");
    this._viewer.addEventListener("scroll", this.onViewerScroll);
    this._viewer.addEventListener("wheel", this.onViewerWheel);
    this._viewer.addEventListener("pointermove", this.onViewerPointerMove);
    this._viewer.addEventListener("pointerdown", this.onViewerPointerDown);    
    this._viewer.addEventListener("touchstart", this.onViewerTouchStart);

    this._mainContainer = this._shadowRoot.querySelector("div#main-container");
    const resizeObserver = new ResizeObserver(this.onMainContainerResize);
    resizeObserver.observe(this._mainContainer);
    this._mainContainerResizeObserver = resizeObserver;
  }

  private onPdfLoadingProgress = (progressData: { loaded: number; total: number }) => {
    // TODO: implement progress display
  };

  private onPdfLoadedAsync = async (doc: PDFDocumentProxy) => {
    this._pdfDocument = doc;

    await this.refreshPagesAsync();
    this.renderVisiblePreviews();
    this.renderVisiblePages();

    this._shadowRoot.querySelector("#panel-bottom").classList.remove("disabled");
  };

  private onPdfClosedAsync = async () => {
    this._shadowRoot.querySelector("#panel-bottom").classList.add("disabled");

    if (this._pdfDocument) {
      this._pdfDocument = null;
    }
    await this.refreshPagesAsync();
  };

  private async refreshPagesAsync(): Promise<void> { 
    this._pages.forEach(x => {
      x.previewContainer.removeEventListener("click", this.onPreviewerPageClick);
      x.destroy();
    });
    this._pages.length = 0;

    const docPagesNumber = this._pdfDocument?.numPages || 0;
    this._shadowRoot.getElementById("paginator-total").innerHTML = docPagesNumber + "";
    if (!docPagesNumber) {
      return;
    }

    for (let i = 0; i < docPagesNumber; i++) {    
      const pageProxy = await this._pdfDocument.getPage(i + 1); 

      const page = new ViewPage(pageProxy, this._maxScale, this._previewWidth);
      page.scale = this._scale;
      page.previewContainer.addEventListener("click", this.onPreviewerPageClick);
      this._previewer.append(page.previewContainer);
      this._viewer.append(page.viewContainer);

      this._pages.push(page);
    } 
  }
  
  private renderVisiblePreviews() {
    if (this._previewerHidden) {
      return;
    }

    const pages = this._pages;
    const visiblePreviewNumbers = this.getVisiblePages(this._previewer, pages, true);
    
    const minPageNumber = Math.max(Math.min(...visiblePreviewNumbers) - this._visibleAdjPages, 0);
    const maxPageNumber = Math.min(Math.max(...visiblePreviewNumbers) + this._visibleAdjPages, pages.length - 1);

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (i >= minPageNumber && i <= maxPageNumber) {
        page.renderPreviewAsync();
      }
    }
  }  

  private renderVisiblePages() {
    const pages = this._pages;
    const visiblePageNumbers = this.getVisiblePages(this._viewer, pages); 
    
    const prevCurrent = this._currentPage;
    const current = this.getCurrentPage(this._viewer, pages, visiblePageNumbers);
    if (!prevCurrent || prevCurrent !== current) {
      pages[prevCurrent]?.previewContainer.classList.remove("current");
      pages[current]?.previewContainer.classList.add("current");
      (<HTMLInputElement>this._shadowRoot.getElementById("paginator-input")).value = current + 1 + "";
      this.scrollToPreview(current);
      this._currentPage = current;
    }
    if (current === -1) {
      return;
    }
    
    const minPageNumber = Math.max(Math.min(...visiblePageNumbers) - this._visibleAdjPages, 0);
    const maxPageNumber = Math.min(Math.max(...visiblePageNumbers) + this._visibleAdjPages, pages.length - 1);

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (i >= minPageNumber && i <= maxPageNumber) {
        page.renderViewAsync();
      } else {
        page.clearView();
      }
    }
  } 
  
  private scrollToPreview(pageNumber: number) { 
    const {top: cTop, height: cHeight} = this._previewer.getBoundingClientRect();
    const {top: pTop, height: pHeight} = this._pages[pageNumber].previewContainer.getBoundingClientRect();

    const cCenter = cTop + cHeight / 2;
    const pCenter = pTop + pHeight / 2;

    const scroll = pCenter - cCenter + this._previewer.scrollTop;
    this._previewer.scrollTo(0, scroll);
    
    // this._pages[pageNumber].previewContainer.scrollIntoView(false);
  }

  private scrollToPage(pageNumber: number) { 
    const {top: cTop} = this._viewer.getBoundingClientRect();
    const {top: pTop} = this._pages[pageNumber].viewContainer.getBoundingClientRect();

    const scroll = pTop - (cTop - this._viewer.scrollTop);
    this._viewer.scrollTo(this._viewer.scrollLeft, scroll);
  }

  //#region zooming
  private setScale(scale: number, cursorPosition: Position = null) {
    if (!scale || scale === this._scale) {
      return;
    }

    let pageContainerUnderPivot: HTMLElement;
    let xPageRatio: number;
    let yPageRatio: number;

    if (cursorPosition) {
      for (const page of this._pages) {
        const {x: x, y: y} = cursorPosition;
        const {x: pX, y: pY, width: pWidth, height: pHeight} = page.viewContainer.getBoundingClientRect();
        // get page under cursor
        if (pX <= x 
          && pX + pWidth >= x
          && pY <= y
          && pY + pHeight >= y) {          
          // get cursor position relative to page dimensions before scaling
          pageContainerUnderPivot = page.viewContainer;
          xPageRatio = (x - pX) / pWidth;
          yPageRatio = (y - pY) / pHeight;    
          break;
        }
      }
    }

    this._scale = scale;
    this._pages.forEach(x => x.scale = this._scale);  
    
    if (pageContainerUnderPivot 
      && // check if page has scrollbars
      (this._viewer.scrollHeight > this._viewer.clientHeight
      || this._viewer.scrollWidth > this._viewer.clientWidth)) {

      // get the position of the point under cursor after scaling   
      const {x: initialX, y: initialY} = cursorPosition;
      const {x: pX, y: pY, width: pWidth, height: pHeight} = pageContainerUnderPivot.getBoundingClientRect();
      const resultX = pX + (pWidth * xPageRatio);
      const resultY = pY + (pHeight * yPageRatio);

      // scroll page to move the point to its initial position in the viewport
      let scrollLeft = this._viewer.scrollLeft + (resultX - initialX);
      let scrollTop = this._viewer.scrollTop + (resultY - initialY);
      scrollLeft = scrollLeft < 0 
        ? 0 
        : scrollLeft;
      scrollTop = scrollTop < 0
        ? 0
        : scrollTop;

      if (scrollTop !== this._viewer.scrollTop
        || scrollLeft !== this._viewer.scrollLeft) {          
        this._viewer.scrollTo(scrollLeft, scrollTop);
        // render will be called from the scroll event handler so no need to call it from here
        return;
      }
    }

    // use timeout to let browser update page layout
    setTimeout(() => this.renderVisiblePages(), 0);
  }

  private zoom(diff: number, cursorPosition: Position = null) {
    const scale = clamp(this._scale + diff, this._minScale, this._maxScale);
    this.setScale(scale, cursorPosition || this.getViewerCenterPosition());
  }

  private zoomOut(cursorPosition: Position = null) {
    this.zoom(-0.25, cursorPosition);
  }
  
  private zoomIn(cursorPosition: Position = null) {
    this.zoom(0.25, cursorPosition);
  }

  private getViewerCenterPosition(): Position {
    const {x, y, width, height} = this._viewer.getBoundingClientRect();
    return <Position>{
      x: x + width / 2,
      y: y + height / 2,
    };
  }
  //#endregion
  
  //#region event handlers
  private onMainContainerResize = (entries: ResizeObserverEntry[], observer: ResizeObserver) => {    
    const {width} = this._mainContainer.getBoundingClientRect();
    if (width < 721) {      
      this._mainContainer.classList.add("mobile");
    } else {      
      this._mainContainer.classList.remove("mobile");
    }
  };

  private onHandToggleClick = () => {
    if (this._mode === "hand") {
      this._mode = "normal";
      this._viewer.classList.remove("hand");
      this._shadowRoot.querySelector("div#toggle-hand").classList.remove("on");
    } else {
      this._mode = "hand";
      this._viewer.classList.add("hand");
      this._shadowRoot.querySelector("div#toggle-hand").classList.add("on");
    }
  };

  //#region previewer events
  private onPreviewerToggleClick = () => {
    if (this._previewerHidden) {
      this._mainContainer.classList.remove("hide-previewer");
      this._shadowRoot.querySelector("div#toggle-previewer").classList.add("on");
      this._previewerHidden = false;
      setTimeout(() => this.renderVisiblePreviews(), 1000);
    } else {      
      this._mainContainer.classList.add("hide-previewer");
      this._shadowRoot.querySelector("div#toggle-previewer").classList.remove("on");
      this._previewerHidden = true;
    }
  };

  private onPreviewerPageClick = (e: Event) => {
    let target = <HTMLElement>e.target;
    let pageNumber: number;
    while (target && !pageNumber) {
      const data = target.dataset["pageNumber"];
      if (data) {
        pageNumber = +data;
      } else {
        target = target.parentElement;
      }
    }    
    if (pageNumber) {
      this.scrollToPage(pageNumber - 1);
    }
  };
  
  private onPreviewerScroll = (e: Event) => {
    this.renderVisiblePreviews();
  };
  //#endregion
  
  //#region paginator events
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
  //#endregion

  //#region zoomer events
  private onZoomOutClick = () => {
    this.zoomOut();
  };

  private onZoomInClick = () => {
    this.zoomIn();
  };
  
  private onZoomFitViewerClick = () => {
    const cWidth = this._viewer.getBoundingClientRect().width;
    const pWidth = this._pages[this._currentPage].viewContainer.getBoundingClientRect().width;
    const scale = clamp((cWidth  - 20) / pWidth * this._scale, this._minScale, this._maxScale);
    this.setScale(scale);
    this.scrollToPage(this._currentPage);
  };
  
  private onZoomFitPageClick = () => {
    const { width: cWidth, height: cHeight } = this._viewer.getBoundingClientRect();
    const { width: pWidth, height: pHeight } = this._pages[this._currentPage].viewContainer.getBoundingClientRect();
    const hScale = clamp((cWidth - 20) / pWidth * this._scale, this._minScale, this._maxScale);
    const vScale = clamp((cHeight - 20) / pHeight * this._scale, this._minScale, this._maxScale);
    this.setScale(Math.min(hScale, vScale));
    this.scrollToPage(this._currentPage);
  };
  //#endregion

  private onViewerScroll = (e: Event) => {
    this.renderVisiblePages();
  };
  
  private onViewerPointerMove = (event: PointerEvent) => {
    const {clientX, clientY} = event;
    const {x: rectX, y: rectY, width, height} = this._viewer.getBoundingClientRect();

    const l = clientX - rectX;
    const t = clientY - rectY;
    const r = width - l;
    const b = height - t;

    if (Math.min(l, r, t, b) > 100) {
      if (!this._panelsHidden && !this._timers.hidePanels) {
        this._timers.hidePanels = setTimeout(() => {
          this._mainContainer.classList.add("hide-panels");
          this._panelsHidden = true;
          this._timers.hidePanels = null;
        }, 5000);
      }      
    } else {
      if (this._timers.hidePanels) {
        clearTimeout(this._timers.hidePanels);
        this._timers.hidePanels = null;
      }
      if (this._panelsHidden) {        
        this._mainContainer.classList.remove("hide-panels");
        this._panelsHidden = false;
      }
    }

    this._pointerInfo.lastPos = {x: clientX, y: clientY};
  };

  private onViewerPointerDown = (event: PointerEvent) => { 
    if (this._mode !== "hand") {
      return;
    }
    
    const {clientX, clientY} = event;
    this._pointerInfo.downPos = {x: clientX, y: clientY};
    this._pointerInfo.downScroll = {x: this._viewer.scrollLeft, y: this._viewer.scrollTop};    

    const onPointerMove = (moveEvent: PointerEvent) => {
      const {x, y} = this._pointerInfo.downPos;
      const {x: left, y: top} = this._pointerInfo.downScroll;
      const dX = moveEvent.clientX - x;
      const dY = moveEvent.clientY - y;
      this._viewer.scrollTo(left - dX, top - dY);
    };
    
    const onPointerUp = (upEvent: PointerEvent) => {
      this._pointerInfo.downPos = null;
      this._pointerInfo.downScroll = null;

      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointerout", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointerout", onPointerUp);
  };

  private onViewerTouchStart = (event: TouchEvent) => { 
    if (event.touches.length !== 2) {
      return;
    }    

    const a = event.touches[0];
    const b = event.touches[1];    
    this._pinchInfo.active = true;
    this._pinchInfo.lastDist = getDistance(a.clientX, a.clientY, b.clientX, b.clientY);

    const onTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length !== 2) {
        return;
      }

      const mA = moveEvent.touches[0];
      const mB = moveEvent.touches[1];    
      const dist = getDistance(mA.clientX, mA.clientY, mB.clientX, mB.clientY);
      const delta = dist - this._pinchInfo.lastDist;
      const factor = Math.floor(delta / this._pinchInfo.minDist);  

      if (factor) {
        const center = getCenter(mA.clientX, mA.clientY, mB.clientX, mB.clientY);
        this._pinchInfo.lastDist = dist;
        this.zoom(factor * this._pinchInfo.sensitivity, center);
      }
    };
    
    const onTouchEnd = (endEvent: TouchEvent) => {
      this._pinchInfo.active = false;
      this._pinchInfo.lastDist = 0;

      (<HTMLElement>event.target).removeEventListener("touchmove", onTouchMove);
      (<HTMLElement>event.target).removeEventListener("touchend", onTouchEnd);
      (<HTMLElement>event.target).removeEventListener("touchcancel", onTouchEnd);
    };

    (<HTMLElement>event.target).addEventListener("touchmove", onTouchMove);
    (<HTMLElement>event.target).addEventListener("touchend", onTouchEnd);
    (<HTMLElement>event.target).addEventListener("touchcancel", onTouchEnd);
  };
  
  private onViewerWheel = (event: WheelEvent) => {
    if (!event.ctrlKey) {
      return;
    }

    event.preventDefault();
    if (event.deltaY > 0) {
      this.zoomOut(this._pointerInfo.lastPos);
    } else {
      this.zoomIn(this._pointerInfo.lastPos);
    }
  };

  //#endregion
  

  //#region page numbers methods
  private getVisiblePages(container: HTMLDivElement, pages: ViewPage[], preview = false): Set<number> {
    const pagesVisible = new Set<number>();
    if (!pages.length) {
      return pagesVisible;
    }

    const cRect = container.getBoundingClientRect();
    const cTop = cRect.top;
    const cBottom = cRect.top + cRect.height;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pRect = preview
        ? page.previewContainer.getBoundingClientRect()
        : page.viewContainer.getBoundingClientRect();
      const pTop = pRect.top;
      const pBottom = pRect.top + pRect.height;

      if (pTop < cBottom && pBottom > cTop) {
        pagesVisible.add(i);
      } else if (pagesVisible.size) {
        break;
      }
    }
    return pagesVisible;
  }
  
  private getCurrentPage(container: HTMLDivElement, pages: ViewPage[], visiblePageNumbers: Set<number>): number {
    const visiblePageNumbersArray = [...visiblePageNumbers];
    if (!visiblePageNumbersArray.length) {
      return -1;
    } else if (visiblePageNumbersArray.length === 1) {
      return visiblePageNumbersArray[0];
    }

    const cRect = container.getBoundingClientRect();
    const cTop = cRect.top;
    const cMiddle = cRect.top + cRect.height / 2;

    for (const i of visiblePageNumbersArray) {
      const pRect = pages[i].viewContainer.getBoundingClientRect();
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
