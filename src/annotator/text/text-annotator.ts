import { Quadruple } from "../../common/types";

import { PageService } from "../../services/page-service";
import { DocumentService } from "../../services/document-service";

import { Annotator, AnnotatorDataChangeEvent } from "../annotator";

export interface TextAnnotatorOptions {
  strokeWidth?: number;  
  color?: Quadruple;
}

export abstract class TextAnnotator extends Annotator {
  protected static lastColor: Quadruple;
  protected static lastStrokeWidth: number;
 
  protected _color: Quadruple;
  protected _strokeWidth: number;
  protected _cloudMode: boolean;
  
  /**current page id */
  protected _pageId: number;
  
  protected constructor(docService: DocumentService, pageService: PageService, 
    parent: HTMLDivElement, options: TextAnnotatorOptions) {
    super(docService, pageService, parent);
    
    this._color = options?.color || TextAnnotator.lastColor || [0, 0, 0, 0.9];
    TextAnnotator.lastColor = this._color;

    this._strokeWidth = options?.strokeWidth || TextAnnotator.lastStrokeWidth || 3;
    TextAnnotator.lastStrokeWidth = this._strokeWidth;
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
      annotatorType: "text",
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
