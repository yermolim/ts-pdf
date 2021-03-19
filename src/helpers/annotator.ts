import { Vec2 } from "../math";

import { DocumentData } from "../document/document-data";
import { AnnotationDict } from "../document/entities/annotations/annotation-dict";

import { PenTempData } from "./pen-temp-data";
import { PageView } from "../page/page-view";

interface PageCoords {
  pageId: number;
  pageX: number;
  pageY: number;
}

export type AnnotatorMode = "select" | "stamp" | "pen" | "geometric";

export class Annotator {
  private readonly _docData: DocumentData;
  private readonly _parent: HTMLDivElement;

  private _mode: AnnotatorMode;
  get mode(): AnnotatorMode {
    return this._mode;
  }
  set mode(value: AnnotatorMode) {
    this.setAnnotationMode(value);
  }

  private _scale = 1;
  get scale(): number {
    return this._scale;
  }
  set scale(value: number) {
    this._scale = value;
  }

  private _renderedPages: PageView[] = [];
  get renderedPages(): PageView[] {
    return this._renderedPages.slice();
  }
  set renderedPages(value: PageView[]) {
    this._renderedPages = value?.length
      ? value.slice()
      : [];
  }
  
  private _overlayContainer: HTMLDivElement;
  get overlayContainer(): HTMLDivElement {
    return this._overlayContainer;
  }

  private _overlay: HTMLDivElement;
  private _svg: SVGGraphicsElement;

  private _parentMutationObserver: MutationObserver;
  private _parentResizeObserver: ResizeObserver;

  private _pageCoords: PageCoords;  

  private _annotationToAdd: AnnotationDict;
  private _annotationPenData: PenTempData;

  constructor(docData: DocumentData, parent: HTMLDivElement) {
    if (!docData) {
      throw new Error("Document data not found");
    }
    if (!parent) {
      throw new Error("Parent container not found");
    }
    this._docData = docData;
    this._parent = parent;

    this.init();
  }

  destroy() {    
    this._parent?.removeEventListener("scroll", this.onScroll);
    this._parentMutationObserver?.disconnect();
    this._parentResizeObserver?.disconnect();
  }  

  deleteSelectedAnnotation() {
    const annotation = this._docData.selectedAnnotation;
    if (annotation) {
      this._docData.removeAnnotation(annotation);
    }
    this.forceRenderPageById(annotation.pageId);
  }

  private onScroll = () => {
    this._overlay.style.left = this._parent.scrollLeft + "px";
    this._overlay.style.top = this._parent.scrollTop + "px";
  };
  
  private init() {
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
    this._parent.addEventListener("scroll", this.onScroll);
    
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
    viewerMObserver.observe(this._parent, {
      attributes: false,
      childList: true,
      subtree: false,
    });

    this._parentMutationObserver = viewerMObserver;
    this._parentResizeObserver = viewerRObserver;
    
    this._overlayContainer = annotationOverlayContainer;
    this._overlay = annotationOverlay;
    this._svg = g;
  }

  //#region annotation modes
  private setAnnotationMode(mode: AnnotatorMode) {
    if (!mode || mode === this._mode) {
      return;
    }
    // disable previous mode
    this.disableCurrentAnnotationMode();
    switch (mode) {
      case "select":
        break;
      case "stamp":
        this._overlay.addEventListener("pointermove", 
          this.onStampPointerMove);
        this._overlay.addEventListener("pointerup", 
          this.onStampPointerUp);
        this.createTempStampAnnotationAsync();
        break;
      case "pen":
        this._overlay.addEventListener("pointerdown", 
          this.onPenPointerDown);
        break;
      case "geometric":
        break;
      default:
        // Execution should not come here
        throw new Error(`Invalid annotation mode: ${mode}`);
    }
    this._mode = mode;
  }

  private disableCurrentAnnotationMode() {    
    if (this._mode) {  
      this._annotationToAdd = null;    
      this._overlayContainer.remove();
      this._svg.innerHTML = "";
      this._svg.removeAttribute("transform");
      switch (this._mode) {
        case "select":
          this._docData.setSelectedAnnotation(null);
          break;
        case "stamp":
          this._overlay.removeEventListener("pointermove", 
            this.onStampPointerMove);
          this._overlay.removeEventListener("pointerup", 
            this.onStampPointerUp);
          break;
        case "pen":
          this._overlay.removeEventListener("pointerdown", 
            this.onPenPointerDown);
          this.removeTempPenData();
          break;
        case "geometric":
          break;
      }
    }
  }
  //#endregion

  //#region stamp annotations
  private async createTempStampAnnotationAsync() {
    const stamp = this._docData.createStampAnnotation("draft");
    const renderResult = await stamp.renderAsync();  

    this._svg.innerHTML = "";  
    this._svg.append(...renderResult.clipPaths || []);
    this._svg.append(renderResult.svg);

    this._annotationToAdd = stamp;
  }

  private onStampPointerMove = (e: PointerEvent) => {
    if (!e.isPrimary) {
      return;
    }

    const {clientX: cx, clientY: cy} = e;

    // bottom-left overlay coords
    const {height: oh, top, left: ox} = this._parent.getBoundingClientRect();
    const oy = top + oh;

    const offsetX = (cx - ox) / this._scale;
    const offsetY = (oy - cy) / this._scale;

    const [x1, y1, x2, y2] = this._annotationToAdd.Rect;
    this._svg.setAttribute("transform",
      `translate(${offsetX - (x2 - x1) / 2} ${offsetY - (y2 - y1) / 2})`);

    // get coords under the pointer relatively to the page under it 
    this.updatePageCoords(cx, cy);
  };

  private onStampPointerUp = (e: PointerEvent) => {
    if (!e.isPrimary) {
      return;
    }

    const {clientX: cx, clientY: cy} = e;
    const pageCoords = this.getPageCoordsUnderPointer(cx, cy);
    this._pageCoords = pageCoords;

    if (!pageCoords || !this._annotationToAdd) {
      return;
    }

    // translate the stamp to the pointer position
    const {pageId, pageX, pageY} = this._pageCoords;
    this._annotationToAdd.moveTo(pageX, pageY);
    this._docData.appendAnnotationToPage(pageId, this._annotationToAdd);

    // rerender the page
    this.forceRenderPageById(pageId);

    // create new temp annotation
    this.createTempStampAnnotationAsync();
  };
  //#endregion

  //#region ink annotations
  private removeTempPenData() {
    if (this._annotationPenData) {
      this._annotationPenData.group.remove();
      document.removeEventListener("visiblepagesrender", this.updatePenGroupPosition);
      this._annotationPenData = null;
    }    
  }

  private resetTempPenData(pageId: number) {    
    this.removeTempPenData();    
    this._annotationPenData = new PenTempData({id: pageId});
    this._svg.append(this._annotationPenData.group);

    // update pen group matrix to position the group properly
    document.addEventListener("visiblepagesrender", this.updatePenGroupPosition);
    this.updatePenGroupPosition();
  }
  
  private onPenPointerDown = (e: PointerEvent) => {
    if (!e.isPrimary) {
      return;
    }

    const {clientX: cx, clientY: cy} = e;
    this.updatePageCoords(cx, cy);
    const pageCoords = this._pageCoords;
    if (!pageCoords) {
      // return if the pointer is outside page
      return;
    }

    const {pageX: px, pageY: py, pageId} = pageCoords;
    if (!this._annotationPenData || pageId !== this._annotationPenData.id) {
      this.resetTempPenData(pageId);
    }
    this._annotationPenData.newPath(new Vec2(px, py));

    const target = e.target as HTMLElement;
    target.addEventListener("pointermove", this.onPenPointerMove);
    target.addEventListener("pointerup", this.onPenPointerUp);    
    target.addEventListener("pointerout", this.onPenPointerUp);    

    // capture pointer to make pointer events fire on same target
    target.setPointerCapture(e.pointerId);
  };

  private onPenPointerMove = (e: PointerEvent) => {
    if (!e.isPrimary || !this._annotationPenData) {
      return;
    }

    const {clientX: cx, clientY: cy} = e;
    this.updatePageCoords(cx, cy);

    const pageCoords = this._pageCoords;
    if (!pageCoords || pageCoords.pageId !== this._annotationPenData.id) {
      // skip move if the pointer is outside of the starting page
      return;
    }
    
    this._annotationPenData.addPosition(new Vec2(pageCoords.pageX, pageCoords.pageY));
  };

  private onPenPointerUp = (e: PointerEvent) => {
    if (!e.isPrimary) {
      return;
    }

    const target = e.target as HTMLElement;
    target.removeEventListener("pointermove", this.onPenPointerMove);
    target.removeEventListener("pointerup", this.onPenPointerUp);    
    target.removeEventListener("pointerout", this.onPenPointerUp);   

    this._annotationPenData?.endPath();
  };

  private updatePenGroupPosition = () => {
    if (!this._annotationPenData) {
      return;
    }
    const page = this._renderedPages.find(x => x.id === this._annotationPenData.id);
    if (!page) {
      // set scale to 0 to hide pen group if it's page is not rendered
      this._annotationPenData.setGroupMatrix(
        [0, 0, 0, 0, 0, 0]);
    }
    const {height: ph, top: ptop, left: px} = page.viewContainer.getBoundingClientRect();
    const py = ptop + ph;
    const {height: vh, top: vtop, left: vx} = this._parent.getBoundingClientRect();
    const vy = vtop + vh;
    const offsetX = (px - vx) / this._scale;
    const offsetY = (vy - py) / this._scale;

    this._annotationPenData.setGroupMatrix(
      [1, 0, 0, 1, offsetX, offsetY]);
  };
  //#endregion

  //#region misc
  private updatePageCoords(clientX: number, clientY: number) {
    const pageCoords = this.getPageCoordsUnderPointer(clientX, clientY);
    if (!pageCoords) {
      this._svg.classList.add("out");
    } else {      
      this._svg.classList.remove("out");
    }

    this._pageCoords = pageCoords;
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

  private forceRenderPageById(pageId: number) {
    this._renderedPages.find(x => x.id === pageId)?.renderViewAsync(true);
  }
  //#endregion
}
