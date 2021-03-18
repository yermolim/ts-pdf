import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist/types/display/api";

import { html, passwordDialogHtml } from "./assets/index.html";
import { styles } from "./assets/styles.html";

import { getDistance } from "./common";
import { clamp, Mat3, Vec2 } from "./math";

import { DocumentData } from "./document/document-data";
import { PageView } from "./page-view";
import { AnnotationDict } from "./document/entities/annotations/annotation-dict";

type ViewerMode = "text" | "hand" | "annotation";
type AnnotationMode = "select" | "stamp" | "pen" | "geometric";

interface PageCoords {
  pageId: number;
  pageX: number;
  pageY: number;
}

export class TsPdfViewer {
  //#region fields
  private readonly _visibleAdjPages = 0;
  private readonly _previewWidth = 100;
  private readonly _minScale = 0.25;
  private readonly _maxScale = 4;
  private _scale = 1;

  private _outerContainer: HTMLDivElement;
  private _shadowRoot: ShadowRoot;

  private _mainContainer: HTMLDivElement;
  private _mainContainerRObserver: ResizeObserver;
  private _panelsHidden: boolean;

  private _previewer: HTMLDivElement;
  private _previewerHidden = true;

  private _viewer: HTMLDivElement;
  private _viewerMode: ViewerMode;

  private _annotationMode: AnnotationMode;
  private _annotationOverlayContainer: HTMLDivElement;
  private _annotationOverlay: HTMLDivElement;
  private _annotationOverlaySvg: SVGGraphicsElement;
  private _annotationOverlayMObserver: MutationObserver;
  private _annotationOverlayRObserver: ResizeObserver;
  private _annotationOverlayPageCoords: PageCoords;  
  private _annotationToAdd: AnnotationDict; 

  private _pages: PageView[] = [];
  private _renderedPages: PageView[] = [];
  private _currentPage = 0;

  private _pdfLoadingTask: PDFDocumentLoadingTask;
  private _pdfDocument: PDFDocumentProxy;  

  private _docData: DocumentData;
  
  private _pointerInfo = {
    lastPos: <Vec2>null,
    downPos: <Vec2>null,
    downScroll: <Vec2>null, 
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
  //#endregion

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

  private static downloadFile(data: Uint8Array, name: string, 
    mime = "application/pdf") { 
    const blob = new Blob([data], {
      type: mime,
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("download", name);
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  destroy() {
    this._pdfLoadingTask?.destroy();
    this._pages.forEach(x => x.destroy());
    if (this._pdfDocument) {
      this._pdfDocument.cleanup();
      this._pdfDocument.destroy();
    }

    this._mainContainerRObserver?.disconnect();
    this._annotationOverlayMObserver?.disconnect();
    this._annotationOverlayRObserver?.disconnect();

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
    } catch (e) {
      throw new Error(`Cannot load file data: ${e.message}`);
    }

    const docData = new DocumentData(data);
    let password: string;
    while (true) {      
      const authenticated = docData.tryAuthenticate(password);
      if (!authenticated) {        
        password = await this.showPasswordDialogAsync();
        if (password === null) {          
          throw new Error("File loading cancelled: authentication aborted");
        }
        continue;
      }
      break;
    }

    // data without supported annotations
    data = docData.getDataWithoutSupportedAnnotations();

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

    await this.onPdfLoadedAsync(doc, docData);
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


  //#region GUI initialization
  private initViewerGUI() {
    this._shadowRoot = this._outerContainer.attachShadow({mode: "open"});
    this._shadowRoot.innerHTML = styles + html;         

    this.initMainDivs();
    this.initViewControls();
    this.initModeSwitchButtons();
    this.initAnnotationButtons();
    this.initAnnotationOverlay();
  }

  private initMainDivs() {
    const mainContainer = this._shadowRoot.querySelector("div#main-container") as HTMLDivElement;

    const mcResizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {    
      const {width} = this._mainContainer.getBoundingClientRect();
      if (width < 721) {      
        this._mainContainer.classList.add("mobile");
      } else {      
        this._mainContainer.classList.remove("mobile");
      }
    });
    mcResizeObserver.observe(mainContainer);

    this._mainContainer = mainContainer;
    this._mainContainerRObserver = mcResizeObserver;  

    this._previewer = this._shadowRoot.querySelector("#previewer");
    this._viewer = this._shadowRoot.querySelector("#viewer") as HTMLDivElement;
    
    // handle annotation selection
    document.addEventListener("annotationselectionchange", (e: Event) => {
      const annotation: AnnotationDict = e["detail"].annotation;
      if (annotation) {
        this._mainContainer.classList.add("annotation-selected");
      } else {
        this._mainContainer.classList.remove("annotation-selected");
      }
    });
  }
  
  private initViewControls() {
    const paginatorInput = this._shadowRoot.getElementById("paginator-input") as HTMLInputElement;
    paginatorInput.addEventListener("input", this.onPaginatorInput);
    paginatorInput.addEventListener("change", this.onPaginatorChange);    
    this._shadowRoot.querySelector("#paginator-prev")
      .addEventListener("click", this.onPaginatorPrevClick);
    this._shadowRoot.querySelector("#paginator-next")
      .addEventListener("click", this.onPaginatorNextClick);

    this._shadowRoot.querySelector("#zoom-out")
      .addEventListener("click", this.onZoomOutClick);
    this._shadowRoot.querySelector("#zoom-in")
      .addEventListener("click", this.onZoomInClick);
    this._shadowRoot.querySelector("#zoom-fit-viewer")
      .addEventListener("click", this.onZoomFitViewerClick);
    this._shadowRoot.querySelector("#zoom-fit-page")
      .addEventListener("click", this.onZoomFitPageClick);

    this._shadowRoot.querySelector("#toggle-previewer")
      .addEventListener("click", this.onPreviewerToggleClick);

    this._previewer.addEventListener("scroll", this.onPreviewerScroll);
    this._viewer.addEventListener("scroll", this.onViewerScroll);
    this._viewer.addEventListener("wheel", this.onViewerWheelZoom);
    this._viewer.addEventListener("pointermove", this.onViewerPointerMove);
    this._viewer.addEventListener("pointerdown", this.onViewerPointerDownScroll);    
    this._viewer.addEventListener("touchstart", this.onViewerTouchZoom); 
    
    this._shadowRoot.querySelector("#button-download-file")
      .addEventListener("click", this.onDownloadFileButtonClick);
  }

  private initModeSwitchButtons() {
    this._shadowRoot.querySelector("#button-mode-text")
      .addEventListener("click", this.onTextModeButtonClick);
    this._shadowRoot.querySelector("#button-mode-hand")
      .addEventListener("click", this.onHandModeButtonClick);
    this._shadowRoot.querySelector("#button-mode-annotation")
      .addEventListener("click", this.onAnnotationModeButtonClick);
    this.setViewerMode("text");    
  }

  private initAnnotationButtons() {
    this._shadowRoot.querySelector("#button-annotation-mode-select")
      .addEventListener("click", this.onAnnotationSelectModeButtonClick);
    this._shadowRoot.querySelector("#button-annotation-mode-stamp")
      .addEventListener("click", this.onAnnotationStampModeButtonClick);
    this._shadowRoot.querySelector("#button-annotation-mode-pen")
      .addEventListener("click", this.onAnnotationPenModeButtonClick);
    this._shadowRoot.querySelector("#button-annotation-mode-geometric")
      .addEventListener("click", this.onAnnotationGeometricModeButtonClick);
    this.setAnnotationMode("select");   
    
    this._shadowRoot.querySelector("#button-annotation-delete")
      .addEventListener("click", this.onAnnotationDeleteButtonClick);
  }

  private initAnnotationOverlay() {
    const annotationOverlayContainer = document.createElement("div");
    annotationOverlayContainer.id = "annotation-overlay-container";
    
    const annotationOverlay = document.createElement("div");
    annotationOverlay.id = "annotation-overlay";
    
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("abs-stretch", "no-margin", "no-padding");
    svg.setAttribute("transform", "matrix(1 0 0 -1 0 0)");
    svg.setAttribute("opacity", "0.5");

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.append(g);

    annotationOverlay.append(svg);
    annotationOverlayContainer.append(annotationOverlay);

    // keep overlay properly positioned depending on the viewer scroll
    this._viewer.addEventListener("scroll", () => {
      annotationOverlay.style.left = this._viewer.scrollLeft + "px";
      annotationOverlay.style.top = this._viewer.scrollTop + "px";
    });
    
    let lastScale: number;
    const updateSvgViewBox = () => {
      const {width: w, height: h} = annotationOverlay.getBoundingClientRect();
      if (!w || !h) {
        return;
      }

      const viewBoxWidth = w / this._scale;
      const viewBoxHeight = h / this._scale;
      svg.setAttribute("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
      lastScale = this._scale;
    };
    updateSvgViewBox();

    // add observers to keep the svg scale actual
    const onPossibleViewerSizeChanged = () => {
      if (this._scale === lastScale) {
        return;
      }
      updateSvgViewBox();
    };
    const viewerRObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      onPossibleViewerSizeChanged();
    });
    const viewerMObserver = new MutationObserver((mutations: MutationRecord[]) => {
      const record = mutations[0];
      if (!record) {
        return;
      }
      record.addedNodes.forEach(x => {
        const element = x as HTMLElement;
        if (element.classList.contains("page")) {
          viewerRObserver.observe(x as HTMLElement);
        }
      });
      record.removedNodes.forEach(x => viewerRObserver.unobserve(x as HTMLElement));
      onPossibleViewerSizeChanged();
    });
    viewerMObserver.observe(this._viewer, {
      attributes: false,
      childList: true,
      subtree: false,
    });

    this._annotationOverlayMObserver = viewerMObserver;
    this._annotationOverlayRObserver = viewerRObserver;
    
    this._annotationOverlayContainer = annotationOverlayContainer;
    this._annotationOverlay = annotationOverlay;
    this._annotationOverlaySvg = g;
  }
  //#endregion


  //#region open/close private
  private onPdfLoadingProgress = (progressData: { loaded: number; total: number }) => {
    // TODO: implement progress display
  };

  private onPdfLoadedAsync = async (doc: PDFDocumentProxy, docData: DocumentData) => {
    this._pdfDocument = doc;
    this._docData = docData;

    await this.refreshPagesAsync();
    this.renderVisiblePreviews();
    this.renderVisiblePages(); 

    this._shadowRoot.querySelector("#bottom-panel").classList.remove("disabled");
  };

  private onPdfClosedAsync = async () => {
    this._shadowRoot.querySelector("#bottom-panel").classList.add("disabled");
    this.setViewerMode("text");

    if (this._pdfDocument) {
      this._pdfDocument = null;
      this._docData = null;
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

      const page = new PageView(pageProxy, this._docData, this._maxScale, this._previewWidth);
      page.scale = this._scale;
      page.previewContainer.addEventListener("click", this.onPreviewerPageClick);
      this._previewer.append(page.previewContainer);
      this._viewer.append(page.viewContainer);

      this._pages.push(page);
    } 
  }
  //#endregion
  
  
  //#region previewer
  private scrollToPreview(pageNumber: number) { 
    const {top: cTop, height: cHeight} = this._previewer.getBoundingClientRect();
    const {top: pTop, height: pHeight} = this._pages[pageNumber].previewContainer.getBoundingClientRect();

    const cCenter = cTop + cHeight / 2;
    const pCenter = pTop + pHeight / 2;

    const scroll = pCenter - cCenter + this._previewer.scrollTop;
    this._previewer.scrollTo(0, scroll);
  }
  
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
 

  //#region viewer  
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

    this._pointerInfo.lastPos = new Vec2(clientX, clientY);
  };

  //#region viewer modes
  private setViewerMode(mode: ViewerMode) {
    if (!mode || mode === this._viewerMode) {
      return;
    }
    this.disableCurrentViewerMode();
    switch (mode) {
      case "text":
        this._mainContainer.classList.add("mode-text");
        this._shadowRoot.querySelector("#button-mode-text").classList.add("on");
        break;
      case "hand":
        this._mainContainer.classList.add("mode-hand");
        this._shadowRoot.querySelector("#button-mode-hand").classList.add("on");
        break;
      case "annotation":
        this._mainContainer.classList.add("mode-annotation");
        this._shadowRoot.querySelector("#button-mode-annotation").classList.add("on");
        break;
      default:
        // Execution should not come here
        throw new Error(`Invalid viewer mode: ${mode}`);
    }
    this._viewerMode = mode;
  }

  private disableCurrentViewerMode() {    
    switch (this._viewerMode) {
      case "text":
        this._mainContainer.classList.remove("mode-text");
        this._shadowRoot.querySelector("#button-mode-text").classList.remove("on");
        break;
      case "hand":
        this._mainContainer.classList.remove("mode-hand");
        this._shadowRoot.querySelector("#button-mode-hand").classList.remove("on");
        break;
      case "annotation":
        this._mainContainer.classList.remove("mode-annotation");
        this._shadowRoot.querySelector("#button-mode-annotation").classList.remove("on");
        this.setAnnotationMode("select");
        break;
      default:
        // mode hasn't been set yet. do nothing
        break;
    }
  }  
  
  private onTextModeButtonClick = () => {
    this.setViewerMode("text");
  };

  private onHandModeButtonClick = () => {
    this.setViewerMode("hand");
  };
  
  private onAnnotationModeButtonClick = () => {
    this.setViewerMode("annotation");
  };
  //#endregion

  //#region viewer scroll
  private scrollToPage(pageNumber: number) { 
    const {top: cTop} = this._viewer.getBoundingClientRect();
    const {top: pTop} = this._pages[pageNumber].viewContainer.getBoundingClientRect();

    const scroll = pTop - (cTop - this._viewer.scrollTop);
    this._viewer.scrollTo(this._viewer.scrollLeft, scroll);
  }
  
  private onViewerScroll = (e: Event) => {
    this.renderVisiblePages();
  };  

  private onViewerPointerDownScroll = (event: PointerEvent) => { 
    if (this._viewerMode !== "hand") {
      return;
    }
    
    const {clientX, clientY} = event;
    this._pointerInfo.downPos = new Vec2(clientX, clientY);
    this._pointerInfo.downScroll = new Vec2(this._viewer.scrollLeft,this._viewer.scrollTop);    

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
  //#endregion

  //#region viewer zoom
  private setScale(scale: number, cursorPosition: Vec2 = null) {
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

  private zoom(diff: number, cursorPosition: Vec2 = null) {
    const scale = clamp(this._scale + diff, this._minScale, this._maxScale);
    this.setScale(scale, cursorPosition || this.getViewerCenterPosition());
  }

  private zoomOut(cursorPosition: Vec2 = null) {
    this.zoom(-0.25, cursorPosition);
  }
  
  private zoomIn(cursorPosition: Vec2 = null) {
    this.zoom(0.25, cursorPosition);
  }

  private getViewerCenterPosition(): Vec2 {
    const {x, y, width, height} = this._viewer.getBoundingClientRect();
    return new Vec2(x + width / 2, y + height / 2);
  }
  
  private onViewerWheelZoom = (event: WheelEvent) => {
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

  private onViewerTouchZoom = (event: TouchEvent) => { 
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
        const center = new Vec2((mB.clientX + mA.clientX) / 2, (mB.clientY + mA.clientY) / 2);
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

  //#endregion
    
  
  //#region pages and paginator
  private getVisiblePages(container: HTMLDivElement, pages: PageView[], preview = false): Set<number> {
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
  
  private getCurrentPage(container: HTMLDivElement, pages: PageView[], visiblePageNumbers: Set<number>): number {
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
   
  private getPageCoordsUnderPointer(clientX: number, clientY: number): PageCoords {
    for (const page of this._renderedPages) {
      const {left: pxMin, top: pyMin, width: pw, height: ph} = page.viewContainer.getBoundingClientRect();
      const pxMax = pxMin + pw;
      const pyMax = pyMin + ph;

      if (clientX < pxMin || clientX > pxMax) {
        continue;
      }
      if (clientY < pyMin || clientY > pyMax) {
        continue;
      }

      // point is inside the page
      const x = (clientX - pxMin) / this._scale;
      const y = (pyMax - clientY) / this._scale;

      return {
        pageId: page.id,
        pageX: x,
        pageY: y,
      };
    }
    // point is not inside a page
    return null;
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

    const renderedPages: PageView[] = [];
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      renderedPages.push(page);
      if (i >= minPageNumber && i <= maxPageNumber) {
        page.renderViewAsync();
      } else {
        page.clearView();
      }
    }

    this._renderedPages = renderedPages;
  } 

  private forceRenderPageById(pageId: number) {
    this._renderedPages.find(x => x.id === pageId)?.renderViewAsync(true);
  }

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
  

  //#region annotations
  private onAnnotationDeleteButtonClick = () => {
    const annotation = this._docData.selectedAnnotation;
    if (annotation) {
      this._docData.removeAnnotation(annotation);
      // rerender the page
      this.forceRenderPageById(annotation.pageId);
    }
  };

  //#region annotation modes
  private setAnnotationMode(mode: AnnotationMode) {
    if (!mode || mode === this._annotationMode) {
      return;
    }
    // disable previous mode
    this.disableCurrentAnnotationMode();
    switch (mode) {
      case "select":
        this._shadowRoot.querySelector("#button-annotation-mode-select").classList.add("on");
        break;
      case "stamp":
        this._shadowRoot.querySelector("#button-annotation-mode-stamp").classList.add("on");
        this._annotationOverlay.addEventListener("pointermove", 
          this.onStampAnnotationOverlayPointerMove);
        this._annotationOverlay.addEventListener("pointerup", 
          this.onStampAnnotationOverlayPointerUp);
        this._viewer.append(this._annotationOverlayContainer);
        this.createTempStampAnnotationAsync();
        break;
      case "pen":
        this._shadowRoot.querySelector("#button-annotation-mode-pen").classList.add("on");
        this._viewer.append(this._annotationOverlayContainer);
        break;
      case "geometric":
        this._shadowRoot.querySelector("#button-annotation-mode-geometric").classList.add("on");
        this._viewer.append(this._annotationOverlayContainer);
        break;
      default:
        // Execution should not come here
        throw new Error(`Invalid annotation mode: ${mode}`);
    }
    this._annotationMode = mode;
  }

  private disableCurrentAnnotationMode() {    
    if (this._annotationMode) {  
      this._annotationToAdd = null;    
      this._annotationOverlayContainer.remove();
      this._annotationOverlaySvg.innerHTML = "";
      switch (this._annotationMode) {
        case "select":
          this._shadowRoot.querySelector("#button-annotation-mode-select").classList.remove("on");
          this._docData.setSelectedAnnotation(null);
          break;
        case "stamp":
          this._shadowRoot.querySelector("#button-annotation-mode-stamp").classList.remove("on");
          this._annotationOverlay.removeEventListener("pointermove", 
            this.onStampAnnotationOverlayPointerMove);
          this._annotationOverlay.removeEventListener("pointerup", 
            this.onStampAnnotationOverlayPointerUp);
          break;
        case "pen":
          this._shadowRoot.querySelector("#button-annotation-mode-pen").classList.remove("on");
          break;
        case "geometric":
          this._shadowRoot.querySelector("#button-annotation-mode-geometric").classList.remove("on");
          break;
      }
    }
  }
  
  private onAnnotationSelectModeButtonClick = () => {
    this.setAnnotationMode("select");
  };

  private onAnnotationStampModeButtonClick = () => {
    this.setAnnotationMode("stamp");
  };

  private onAnnotationPenModeButtonClick = () => {
    this.setAnnotationMode("pen");
  };
  
  private onAnnotationGeometricModeButtonClick = () => {
    this.setAnnotationMode("geometric");
  };
  //#endregion

  //#region stamp annotations
  private async createTempStampAnnotationAsync() {
    const stamp = this._docData.createStampAnnotation("draft");
    const renderResult = await stamp.renderAsync();  

    this._annotationOverlaySvg.innerHTML = "";  
    this._annotationOverlaySvg.append(...renderResult.clipPaths || []);
    this._annotationOverlaySvg.append(renderResult.svg);

    this._annotationToAdd = stamp;
  }

  private onStampAnnotationOverlayPointerMove = (e: PointerEvent) => {
    if (!e.isPrimary) {
      return;
    }

    const {clientX: cx, clientY: cy} = e;

    // bottom-left overlay coords
    const {height: oh, top, left: ox} = this._viewer.getBoundingClientRect();
    const oy = top + oh;

    const offsetX = (cx - ox) / this._scale;
    const offsetY = (oy - cy) / this._scale;

    const [x1, y1, x2, y2] = this._annotationToAdd.Rect;
    this._annotationOverlaySvg.setAttribute("transform",
      `translate(${offsetX - (x2 - x1) / 2} ${offsetY - (y2 - y1) / 2})`);

    // get coords under the pointer relatively to the page under it 
    const pageCoords = this.getPageCoordsUnderPointer(cx, cy);
    if (!pageCoords) {
      this._annotationOverlaySvg.classList.add("out");
    } else {      
      this._annotationOverlaySvg.classList.remove("out");
    }

    this._annotationOverlayPageCoords = pageCoords;
  };

  private onStampAnnotationOverlayPointerUp = (e: PointerEvent) => {
    if (!e.isPrimary) {
      return;
    }

    const {clientX: cx, clientY: cy} = e;
    const pageCoords = this.getPageCoordsUnderPointer(cx, cy);
    this._annotationOverlayPageCoords = pageCoords;

    if (!pageCoords || !this._annotationToAdd) {
      return;
    }

    // translate the stamp to the pointer position
    const {pageId, pageX, pageY} = this._annotationOverlayPageCoords;
    this._annotationToAdd.moveTo(pageX, pageY);
    this._docData.appendAnnotationToPage(pageId, this._annotationToAdd);

    // rerender the page
    this.forceRenderPageById(pageId);

    // create new temp annotation
    this.createTempStampAnnotationAsync();
  };
  //#endregion

  //#endregion


  //#region misc 
  private onDownloadFileButtonClick = () => {
    const data = this._docData?.getDataWithUpdatedAnnotations();

    // DEBUG
    // this.openPdfAsync(data);

    if (data?.length) {
      TsPdfViewer.downloadFile(data, `file_${new Date().toISOString()}.pdf`);
    }    
  };

  private async showPasswordDialogAsync(): Promise<string> {

    const passwordPromise = new Promise<string>((resolve, reject) => {

      const dialogContainer = document.createElement("div");
      dialogContainer.id = "password-dialog";
      dialogContainer.innerHTML = passwordDialogHtml;
      this._mainContainer.append(dialogContainer);

      let value = "";      
      const input = this._shadowRoot.getElementById("password-input") as HTMLInputElement;
      input.placeholder = "Enter password...";
      input.addEventListener("change", () => value = input.value);

      const ok = () => {
        dialogContainer.remove();
        resolve(value);
      };
      const cancel = () => {
        dialogContainer.remove();
        resolve(null);
      };

      dialogContainer.addEventListener("click", (e: Event) => {
        if (e.target === dialogContainer) {
          cancel();
        }
      });
      
      this._shadowRoot.getElementById("password-ok").addEventListener("click", ok);
      this._shadowRoot.getElementById("password-cancel").addEventListener("click", cancel);
    });

    return passwordPromise;
  }
  //#endregion
}
