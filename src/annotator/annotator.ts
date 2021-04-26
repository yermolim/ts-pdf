import { PointerDownInfo } from "../common/types";

import { DocumentData } from "../document/document-data";

import { PageView } from "../components/pages/page-view";
import { PagesRenderedEvent, pagesRenderedEvent } from "../components/pages/page-service";

//#region custom events
export const annotatorDataChangeEvent = "tspdf-annotatordatachange" as const;
export interface AnnotatorDataChangeEventDetail {
  annotatorType: string;
  elementCount?: number;
  undoable?: boolean;
  clearable?: boolean;
  saveable?: boolean;
}
export class AnnotatorDataChangeEvent extends CustomEvent<AnnotatorDataChangeEventDetail> {
  constructor(detail: AnnotatorDataChangeEventDetail) {
    super(annotatorDataChangeEvent, {detail});
  }
}
declare global {
  interface HTMLElementEventMap {
    [annotatorDataChangeEvent]: AnnotatorDataChangeEvent;
  }
}
//#endregion

/**coordinates in the PDF page coordinate system */
interface PageCoords {
  pageId: number;
  pageX: number;
  pageY: number;
}

/**
 * base class for annotation addition tools
 */
export abstract class Annotator {
  protected readonly _docData: DocumentData;
  protected readonly _parent: HTMLDivElement;

  protected _scale: number;
  /**current page view scale */
  get scale(): number {
    return this._scale;
  }
  protected _lastScale: number;

  protected _pages: PageView[];
  /**currently rendered PDF cocument pages */
  get pages(): PageView[] {
    return this._pages.slice();
  }
  /**currently rendered PDF cocument pages */
  set pages(value: PageView[]) {
    this._pages = value?.length
      ? value.slice()
      : [];
    // take scale from the first page (the scale value is uniform for all pages)
    this._scale = this._pages[0]?.scale || 1;
    this.refreshViewBox();
  }  
  
  protected _overlayContainer: HTMLDivElement;
  get overlayContainer(): HTMLDivElement {
    return this._overlayContainer;
  }

  protected _overlay: HTMLDivElement;
  protected _svgWrapper: SVGGraphicsElement;
  protected _svgGroup: SVGGraphicsElement;

  protected _parentMutationObserver: MutationObserver;
  protected _parentResizeObserver: ResizeObserver;

  protected _lastPointerDownInfo: PointerDownInfo;
  protected _pointerCoordsInPageCS: PageCoords;  

  constructor(docData: DocumentData, parent: HTMLDivElement, pages?: PageView[]) {
    if (!docData) {
      throw new Error("Document data not found");
    }
    if (!parent) {
      throw new Error("Parent container not found");
    }
    this._docData = docData;
    this._parent = parent;
    this._pages = pages || [];
    this._scale = this._pages[0]?.scale || 1;
  }

  /**free resources to let GC clean them to avoid memory leak */
  destroy() {    
    this._docData.eventController.removeListener(pagesRenderedEvent, this.onPagesRendered);

    this._parent?.removeEventListener("scroll", this.onParentScroll);
    this._parentMutationObserver?.disconnect();
    this._parentResizeObserver?.disconnect();

    this._overlayContainer.remove();
  }
  
  protected init() {
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
    
    this._overlayContainer = annotationOverlayContainer;
    this._overlay = annotationOverlay;
    this._svgWrapper = svg;
    this._svgGroup = g;    

    this._parent.append(this._overlayContainer);

    this.refreshViewBox();    
    // add handlers and observers to keep the svg scale actual
    this.initEventHandlers();
  }

  /**
   * initialize observers for the parent mutations
   */
  protected initEventHandlers() {
    this._overlay.addEventListener("pointerdown", this.onOverlayPointerDown);

    this._parent.addEventListener("scroll", this.onParentScroll);
    const parentRObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      this.refreshViewBox();
    });
    const parentMObserver = new MutationObserver((mutations: MutationRecord[]) => {
      const record = mutations[0];
      if (!record) {
        return;
      }
      record.addedNodes.forEach(x => {
        const element = x as HTMLElement;
        if (element.classList.contains("page")) {
          parentRObserver.observe(x as HTMLElement);
        }
      });
      record.removedNodes.forEach(x => parentRObserver.unobserve(x as HTMLElement));
      this.refreshViewBox();
    });
    parentRObserver.observe(this._parent);
    parentMObserver.observe(this._parent, {
      attributes: false,
      childList: true,
      subtree: false,
    });
    this._parentMutationObserver = parentMObserver;
    this._parentResizeObserver = parentRObserver;

    // handle page render events to keep the view box dimensions actual
    this._docData.eventController.addListener(pagesRenderedEvent, this.onPagesRendered);
  }

  /**
   * refresh the inner SVG view box dimensions 
   */
  protected refreshViewBox() {
    const {width: w, height: h} = this._overlay.getBoundingClientRect();
    if (!w || !h) {
      return;
    }

    this._overlay.style.left = this._parent.scrollLeft + "px";
    this._overlay.style.top = this._parent.scrollTop + "px";   
    const viewBoxWidth = w / this._scale;
    const viewBoxHeight = h / this._scale;
    this._svgWrapper.setAttribute("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
    this._lastScale = this._scale;
    
    this.refreshGroupPosition();
  }

  protected onPagesRendered = (event: PagesRenderedEvent) => {   
    // update current pages which forces the view box dimensions to be recalculated  
    this.pages = event.detail.pages || [];
  };

  protected onParentScroll = () => {
    this.refreshViewBox();
  }; 
  
  protected onOverlayPointerDown = (e: PointerEvent) => {
    if (!e.isPrimary) {
      // the event source is the non-primary touch. ignore that
      return;
    }

    // save the current pointer information to check the click duration and the displacement relative to the starting point
    this._lastPointerDownInfo = {
      timestamp: performance.now(),
      clientX: e.clientX,
      clientY: e.clientY,
    };
  };
  
  /**
   * update the current pointer coordinates using the page coordinate system
   * @param clientX 
   * @param clientY 
   */
  protected updatePointerCoords(clientX: number, clientY: number) {
    const pageCoords = this.getPageCoordsUnderPointer(clientX, clientY);
    if (!pageCoords) {
      this._svgGroup.classList.add("out");
    } else {      
      this._svgGroup.classList.remove("out");
    }

    this._pointerCoordsInPageCS = pageCoords;
  }  
   
  /**
   * convert client coordinates to the current page coordinate system
   * @param clientX 
   * @param clientY 
   * @returns 
   */
  protected getPageCoordsUnderPointer(clientX: number, clientY: number): PageCoords {
    for (const page of this._pages) {
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
  
  protected abstract refreshGroupPosition(): void;
}
