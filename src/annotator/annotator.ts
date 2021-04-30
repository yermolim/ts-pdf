import { PointerDownInfo } from "../common/types";

import { DocumentService } from "../services/document-service";
import { PageCoords, PageService, PagesRenderedEvent, pagesRenderedEvent } 
  from "../services/page-service";

//#region custom events
export const annotatorTypes = ["geom", "pen", "stamp", "text"] as const;
export type AnnotatorType = typeof annotatorTypes[number];

export const annotatorDataChangeEvent = "tspdf-annotatordatachange" as const;
export interface AnnotatorDataChangeEventDetail {
  annotatorType: AnnotatorType;
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

/**
 * base class for annotation addition tools
 */
export abstract class Annotator {
  protected readonly _docService: DocumentService;
  protected readonly _pageService: PageService;
  protected readonly _parent: HTMLDivElement;
  
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

  constructor(docService: DocumentService, pageService: PageService, parent: HTMLDivElement) {
    if (!docService) {
      throw new Error("Document service not defined");
    }
    if (!pageService) {
      throw new Error("Page service not defined");
    }
    if (!parent) {
      throw new Error("Parent container not defined");
    }
    this._docService = docService;
    this._parent = parent;
    this._pageService = pageService;
  }

  /**free resources to let GC clean them to avoid memory leak */
  destroy() {    
    this._docService.eventService.removeListener(pagesRenderedEvent, this.onPagesRendered);

    this._parent?.removeEventListener("scroll", this.onParentScroll);
    this._parentMutationObserver?.disconnect();
    this._parentResizeObserver?.disconnect();

    this._overlayContainer.remove();
  }

  /**
   * refresh the inner SVG view box dimensions 
   */
  refreshViewBox() {
    const {width: w, height: h} = this._overlay.getBoundingClientRect();
    if (!w || !h) {
      return;
    }

    this._overlay.style.left = this._parent.scrollLeft + "px";
    this._overlay.style.top = this._parent.scrollTop + "px";   
    const viewBoxWidth = w / this._pageService.scale;
    const viewBoxHeight = h / this._pageService.scale;
    this._svgWrapper.setAttribute("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
    
    this.refreshGroupPosition();
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
    this._docService.eventService.addListener(pagesRenderedEvent, this.onPagesRendered);
  }

  protected onPagesRendered = (event: PagesRenderedEvent) => { 
    this.refreshViewBox();
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
    const pageCoords = this._pageService.getPageCoordsUnderPointer(clientX, clientY);
    if (!pageCoords) {
      this._svgGroup.classList.add("out");
    } else {      
      this._svgGroup.classList.remove("out");
    }

    this._pointerCoordsInPageCS = pageCoords;
  }  
  
  abstract undo(): void; 
  
  abstract clear(): void; 
  
  abstract saveAnnotation(): void;  
  
  protected abstract refreshGroupPosition(): void;
}
