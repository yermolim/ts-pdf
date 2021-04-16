import { Vec2 } from "../math";
import { Quadruple } from "../common";
import { DocumentData } from "../document/document-data";
import { InkAnnotation } from "../document/entities/annotations/markup/ink-annotation";

import { Annotator } from "./annotator";
import { PenData } from "./pen-data";

//#region custom events
export const pathChangeEvent = "tspdf-penpathchange" as const;
export interface PathChangeEventDetail {
  pathCount: number;
}
export class PathChangeEvent extends CustomEvent<PathChangeEventDetail> {
  constructor(detail: PathChangeEventDetail) {
    super(pathChangeEvent, {detail});
  }
}
declare global {
  interface HTMLElementEventMap {
    [pathChangeEvent]: PathChangeEvent;
  }
}
//#endregion

export interface PenAnnotatorOptions {
  strokeWidth?: number;  
  color?: Quadruple;
}

/**tool for adding ink (hand-drawn) annotations */
export class PenAnnotator extends Annotator {
  protected static lastColor: Quadruple;
  protected static lastStrokeWidth: number;

  protected _annotationPenData: PenData;  
  protected _color: Quadruple;
  protected _strokeWidth: number;

  constructor(docData: DocumentData, parent: HTMLDivElement, options?: PenAnnotatorOptions) {
    super(docData, parent);
    this.init();

    this._color = options?.color || PenAnnotator.lastColor || [0, 0, 0, 0.9];
    PenAnnotator.lastColor = this._color;

    this._strokeWidth = options?.strokeWidth || PenAnnotator.lastStrokeWidth || 3;
    PenAnnotator.lastStrokeWidth = this._strokeWidth;
  }

  destroy() {   
    this.removeTempPenData();
    super.destroy();
  }

  /**remove the last path from the temp path group */
  undoPath() {
    this._annotationPenData?.removeLastPath();
    this.emitPathCount();
  }

  /**clear the temp path group */
  clearPaths() {
    this.removeTempPenData();
  }

  /**
   * save the current temp path as an ink annotation and append it to the page
   */
  savePathsAsInkAnnotation() {
    if (!this._annotationPenData) {
      return;
    }

    const pageId = this._annotationPenData.id;
    const inkAnnotation = InkAnnotation.createFromPenData(
      this._annotationPenData, this._docData.userName);

    // DEBUG
    // console.log(inkAnnotation);

    this._docData.appendAnnotationToPage(pageId, inkAnnotation);
    
    this.removeTempPenData();
  }
  
  protected init() {
    super.init();    
    this._overlay.addEventListener("pointerdown", 
      this.onPenPointerDown);
  }  

  protected refreshViewBox() {
    super.refreshViewBox();
    this.refreshPenGroupPosition();
  }

  /**
   * adapt the Svg group positions to the current view box dimensions
   */
  protected refreshPenGroupPosition() {
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
    const {height: vh, top: vtop, left: vx} = this._overlay.getBoundingClientRect();
    const vy = vtop + vh;
    const offsetX = (px - vx) / this._scale;
    const offsetY = (vy - py) / this._scale;

    this._annotationPenData.setGroupMatrix(
      [1, 0, 0, 1, offsetX, offsetY]);
  }

  /**clear the temp path group */
  protected removeTempPenData() {
    if (this._annotationPenData) {
      this._annotationPenData.group.remove();
      this._annotationPenData = null;
      this.emitPathCount();
    }    
  }

  /**
   * clear the current temp path group and create a new empty one instead
   * @param pageId 
   */
  protected resetTempPenData(pageId: number) {    
    this.removeTempPenData();    
    this._annotationPenData = new PenData({
      id: pageId, 
      color: this._color,
      strokeWidth: this._strokeWidth,
    });
    this._svgGroup.append(this._annotationPenData.group);

    // update pen group matrix to position the group properly
    this.refreshPenGroupPosition();
  }
  
  protected onPenPointerDown = (e: PointerEvent) => {
    if (!e.isPrimary || e.button === 2) {
      return;
    }    

    const {clientX: cx, clientY: cy} = e;
    this.updatePointerCoords(cx, cy);
    const pageCoords = this._pointerCoordsInPageCS;
    if (!pageCoords) {
      // return if the pointer is outside page
      return;
    }

    const {pageX: px, pageY: py, pageId} = pageCoords;
    if (!this._annotationPenData || pageId !== this._annotationPenData.id) {
      // the current page changed. reset the temp group
      this.resetTempPenData(pageId);
    }

    // create a new temp path
    this._annotationPenData.newPath(new Vec2(px, py));

    const target = e.target as HTMLElement;
    target.addEventListener("pointermove", this.onPenPointerMove);
    target.addEventListener("pointerup", this.onPenPointerUp);    
    target.addEventListener("pointerout", this.onPenPointerUp);  
    // capture pointer to make pointer events fire on same target
    target.setPointerCapture(e.pointerId);
  };

  protected onPenPointerMove = (e: PointerEvent) => {
    if (!e.isPrimary || !this._annotationPenData) {
      return;
    }

    const {clientX: cx, clientY: cy} = e;
    this.updatePointerCoords(cx, cy);

    const pageCoords = this._pointerCoordsInPageCS;
    if (!pageCoords || pageCoords.pageId !== this._annotationPenData.id) {
      // skip move if the pointer is outside of the starting page
      return;
    }
    
    // add the current pointer position to the current temp path
    this._annotationPenData.addPosition(new Vec2(pageCoords.pageX, pageCoords.pageY));
  };

  protected onPenPointerUp = (e: PointerEvent) => {
    if (!e.isPrimary) {
      return;
    }

    const target = e.target as HTMLElement;
    target.removeEventListener("pointermove", this.onPenPointerMove);
    target.removeEventListener("pointerup", this.onPenPointerUp);    
    target.removeEventListener("pointerout", this.onPenPointerUp);
    target.releasePointerCapture(e.pointerId);   

    this._annotationPenData?.endPath();
    this.emitPathCount();
  };

  protected emitPathCount() {
    this._parent.dispatchEvent(new PathChangeEvent({
      pathCount: this._annotationPenData?.pathCount || 0,
    }));
  }
}
