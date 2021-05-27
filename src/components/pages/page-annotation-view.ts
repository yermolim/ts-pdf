import { Vec2 } from "../../common/math";
import { Quadruple } from "../../common/types";

import { DocumentService, annotChangeEvent, 
  AnnotEvent, AnnotSelectionRequestEvent, AnnotFocusRequestEvent } from "../../services/document-service";
import { AnnotationDict, AnnotationRenderResult } from "../../document/entities/annotations/annotation-dict";

export class PageAnnotationView {
  private readonly _pageId: number;
  private readonly _viewbox: Quadruple;

  private _docService: DocumentService;
  private _rendered = new Set<AnnotationDict>();

  private _container: HTMLDivElement;
  private _svg: SVGSVGElement;

  private _destroyed: boolean;

  constructor(docService: DocumentService, pageId: number, pageDimensions: Vec2) {
    if (!docService || isNaN(pageId) || !pageDimensions) {
      throw new Error("Required argument not found");
    }
    this._pageId = pageId;
    this._viewbox = [0, 0, pageDimensions.x, pageDimensions.y];

    this._docService = docService;

    this._container = document.createElement("div");
    this._container.classList.add("page-annotations");

    this._svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this._svg.classList.add("page-annotations-controls");
    this._svg.setAttribute("data-page-id", pageId + "");
    this._svg.setAttribute("viewBox", `0 0 ${pageDimensions.x} ${pageDimensions.y}`);
    // flip Y to match PDF coords where 0,0 is the lower-left corner
    this._svg.setAttribute("transform", "scale(1, -1)");
    // handle annotation selection
    this._svg.addEventListener("pointerdown", (e: PointerEvent) => {
      if (e.target === this._svg) {
        docService.setSelectedAnnotation(null);
      }
    });    
  } 

  /**free the resources that can prevent garbage to be collected */
  destroy() {
    this.remove();
    this._container = null;
    this._destroyed = true;

    this._rendered.forEach(x => {
      x.$onPointerDownAction = null;
      x.$onPointerEnterAction = null;
      x.$onPointerLeaveAction = null;
    });
    this._rendered.clear();
  }

  /**remove the container from DOM */
  remove() {    
    this._container?.remove();
    this._docService.eventService.removeListener(annotChangeEvent, this.onAnnotationSelectionChange);
  }  

  /**
   * render the page annotations and append them to the specified parent container
   * @param parent 
   * @returns 
   */
  async appendAsync(parent: HTMLElement) {
    if (this._destroyed) {
      return;
    }
    
    await this.renderAnnotationsAsync();
    parent.append(this._container);
    this._docService.eventService.addListener(annotChangeEvent, this.onAnnotationSelectionChange);
  }

  private async renderAnnotationsAsync(): Promise<boolean> {    
    this.clear();

    const annotations = await this._docService.getPageAnnotationsAsync(this._pageId) || [];

    for (let i = 0; i < annotations.length || 0; i++) {
      const annotation = annotations[i];
      if (annotation.deleted) {
        continue;
      }

      let renderResult: AnnotationRenderResult;
      if (!this._rendered.has(annotation)) {
        // attach events to the annotation
        annotation.$onPointerDownAction = (e: PointerEvent) => {
          this._docService.eventService.dispatchEvent(new AnnotSelectionRequestEvent({annotation}));
        };        
        annotation.$onPointerEnterAction = (e: PointerEvent) => {
          this._docService.eventService.dispatchEvent(new AnnotFocusRequestEvent({annotation}));
        };        
        annotation.$onPointerLeaveAction = (e: PointerEvent) => {
          this._docService.eventService.dispatchEvent(new AnnotFocusRequestEvent({annotation: null}));
        };
        renderResult = await annotation.renderAsync(this._viewbox);
      } else {
        renderResult = annotation.lastRenderResult || await annotation.renderAsync(this._viewbox);
      }   

      if (!renderResult) {
        continue;
      }      

      this._rendered.add(annotation);
      this._svg.append(renderResult.controls);
      this._container.append(renderResult.content);
    }

    this._container.append(this._svg);
    return true;
  }

  private clear() {
    this._container.innerHTML = "";
    this._svg.innerHTML = "";
  }

  private onAnnotationSelectionChange = (e: AnnotEvent) => {
    if (e.detail.type === "select") {
      // toggle "touchAction" to prevent default gestures from interfering with the annotation edit logic
      if (e.detail.annotations?.length) {
        this._container.style.touchAction = "none";
      } else {
        this._container.style.touchAction = "";
      }
    }
  };
}
