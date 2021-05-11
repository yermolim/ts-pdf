import { Quadruple } from "../../common/types";

import { DocumentService } from "../../services/document-service";
import { PageService } from "../../services/page-service";

import { Annotator, AnnotatorDataChangeEvent } from "../annotator";
export interface GeometricAnnotatorOptions {
  strokeWidth?: number;  
  color?: Quadruple;
  /**enables replacing straight lines with cloud-like curves */
  cloudMode?: boolean;
}

export abstract class GeometricAnnotator extends Annotator { 
  protected _color: Quadruple;
  protected _strokeWidth: number;
  protected _cloudMode: boolean;
  
  /**current page id */
  protected _pageId: number;
  
  protected constructor(docService: DocumentService, pageService: PageService, parent: HTMLDivElement, 
    options: GeometricAnnotatorOptions) {
    super(docService, pageService, parent);
    
    this._color = options?.color || [0, 0, 0, 1];
    this._strokeWidth = options?.strokeWidth || 3;    
    this._cloudMode = options?.cloudMode || false;
  }
  
  destroy() {
    this.clearGroup();
    super.destroy();
  }

  protected init() {
    super.init();
  }
  
  protected emitDataChanged(count: number, 
    saveable?: boolean, clearable?: boolean, undoable?: boolean) {
    this._docService.eventService.dispatchEvent(new AnnotatorDataChangeEvent({
      annotatorType: "geom",
      elementCount: count,
      undoable,
      clearable,
      saveable,
    }));
  }

  protected clearGroup() {
    this._svgGroup.innerHTML = "";
    this.emitDataChanged(0);
  }
    
  protected refreshGroupPosition() {
    if (!this._pageId && this._pageId !== 0) {
      // page for drawing not selected
      return;
    }    

    const page = this._pageService.renderedPages.find(x => x.id === this._pageId);
    if (!page) {
      // set scale to 0 to hide the svg group if it's page is not rendered
      this._svgGroup.setAttribute("transform", "scale(0)");
      return;
    }

    const {height: pageHeight, width: pageWidth, top: pageTop, left: pageLeft} = 
      page.viewContainer.getBoundingClientRect();
    const pageBottom = pageTop + pageHeight;
    const pageRight = pageLeft + pageWidth;
    const {height: overlayHeight, top: overlayTop, left: overlayLeft} = 
      this._overlay.getBoundingClientRect();
    const overlayBottom = overlayTop + overlayHeight;
    const rotation = page.rotation;
    const scale = page.scale;
    let offsetX: number;
    let offsetY: number;    
    switch (rotation) {
      case 0:
        // bottom-left page corner
        offsetX = (pageLeft - overlayLeft) / scale;
        offsetY = (overlayBottom - pageBottom) / scale;
        break;
      case 90:
        // top-left page corner
        offsetX = (pageLeft - overlayLeft) / scale;
        offsetY = (overlayBottom - pageTop) / scale;
        break;
      case 180:    
        // top-right page corner
        offsetX = (pageRight - overlayLeft) / scale;
        offsetY = (overlayBottom - pageTop) / scale; 
        break;
      case 270:
        // bottom-right page corner
        offsetX = (pageRight - overlayLeft) / scale;
        offsetY = (overlayBottom - pageBottom) / scale;
        break;
      default:
        throw new Error(`Invalid rotation degree: ${rotation}`);
    }
    this._svgGroup.setAttribute("transform",
      `translate(${offsetX} ${offsetY}) rotate(${-rotation})`);     
  }
  
  abstract undo(): void;
  
  abstract clear(): void;
  
  abstract saveAnnotation(): void;
}
