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
      this._svgGroup.setAttribute("transform", `matrix(${[0, 0, 0, 0, 0, 0].join(" ")})`);
      return;
    }

    const {height: ph, top: ptop, left: px} = page.viewContainer.getBoundingClientRect();
    const py = ptop + ph;
    const {height: vh, top: vtop, left: vx} = this._overlay.getBoundingClientRect();
    const vy = vtop + vh;
    const offsetX = (px - vx) / this._pageService.scale;
    const offsetY = (vy - py) / this._pageService.scale;
    this._svgGroup.setAttribute("transform", `matrix(${[1, 0, 0, 1, offsetX, offsetY].join(" ")})`);
  }
  
  abstract undo(): void;
  
  abstract clear(): void;
  
  abstract saveAnnotation(): void;
}
