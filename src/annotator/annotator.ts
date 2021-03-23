import { DocumentData } from "../document/document-data";
import { PageView } from "../page/page-view";

interface PageCoords {
  pageId: number;
  pageX: number;
  pageY: number;
}

export abstract class Annotator {
  protected readonly _docData: DocumentData;
  protected readonly _parent: HTMLDivElement;

  protected _scale = 1;
  get scale(): number {
    return this._scale;
  }
  set scale(value: number) {
    this._scale = value;
  }
  protected _lastScale: number;

  protected _renderedPages: PageView[] = [];
  get renderedPages(): PageView[] {
    return this._renderedPages.slice();
  }
  set renderedPages(value: PageView[]) {
    this._renderedPages = value?.length
      ? value.slice()
      : [];
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

  protected _pageCoords: PageCoords;

  constructor(docData: DocumentData, parent: HTMLDivElement) {
    if (!docData) {
      throw new Error("Document data not found");
    }
    if (!parent) {
      throw new Error("Parent container not found");
    }
    this._docData = docData;
    this._parent = parent;
  }

  destroy() {    
    this._overlayContainer.remove();

    this._parent?.removeEventListener("scroll", this.onParentScroll);
    this._parentMutationObserver?.disconnect();
    this._parentResizeObserver?.disconnect();
  }  

  deleteSelectedAnnotation() {
    const annotation = this._docData.selectedAnnotation;
    if (annotation) {
      this._docData.removeAnnotation(annotation);
    }
    this.forceRenderPageById(annotation.$pageId);
  }

  refreshViewBox() {
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
  }

  protected onParentScroll = () => {
    this.refreshViewBox();
  };

  protected initObservers() {
    this._parent.addEventListener("scroll", this.onParentScroll);
    const onPossibleViewerSizeChanged = () => {
      if (this._scale === this._lastScale) {
        return;
      }
      this.refreshViewBox();
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
    this.initObservers();
  }
  
  protected updatePageCoords(clientX: number, clientY: number) {
    const pageCoords = this.getPageCoordsUnderPointer(clientX, clientY);
    if (!pageCoords) {
      this._svgGroup.classList.add("out");
    } else {      
      this._svgGroup.classList.remove("out");
    }

    this._pageCoords = pageCoords;
  }  
   
  protected getPageCoordsUnderPointer(clientX: number, clientY: number): PageCoords {
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

  protected forceRenderPageById(pageId: number) {
    this._renderedPages.find(x => x.id === pageId)?.renderViewAsync(true);
  }
}
