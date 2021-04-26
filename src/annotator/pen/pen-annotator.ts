import { Vec2, vecMinMax } from "../../common/math";
import { Quadruple } from "../../common/types";
import { getRandomUuid } from "../../common/uuid";

import { DocumentData } from "../../document/document-data";
import { InkAnnotation, InkAnnotationDto } from "../../document/entities/annotations/markup/ink-annotation";

import { PageView } from "../../components/pages/page-view";
import { Annotator } from "../annotator";
import { PenData } from "./pen-data";

//#region custom events
export const penDataChangeEvent = "tspdf-pendatachange" as const;
export interface PenDataChangeEventDetail {
  pathCount: number;
}
export class PenDataChangeEvent extends CustomEvent<PenDataChangeEventDetail> {
  constructor(detail: PenDataChangeEventDetail) {
    super(penDataChangeEvent, {detail});
  }
}
declare global {
  interface HTMLElementEventMap {
    [penDataChangeEvent]: PenDataChangeEvent;
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

  constructor(docData: DocumentData, parent: HTMLDivElement, 
    pages: PageView[], options?: PenAnnotatorOptions) {
    super(docData, parent, pages);
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
  undo() {
    this._annotationPenData?.removeLastPath();
    this.emitPathCount();
  }

  /**clear the temp path group */
  clear() {
    this.removeTempPenData();
  }

  /**
   * save the current temp path as an ink annotation and append it to the page
   */
  saveAnnotation() {
    if (!this._annotationPenData) {
      return;
    }

    const pageId = this._annotationPenData.id;
    const dto = this.buildAnnotationDto(this._annotationPenData);
    const annotation = InkAnnotation.createFromDto(dto);

    // DEBUG
    // console.log(annotation);

    this._docData.appendAnnotationToPage(pageId, annotation);
    
    this.removeTempPenData();
  }
  
  protected init() {
    super.init();    
    this._overlay.addEventListener("pointerdown", 
      this.onPointerDown);
  }

  /**
   * adapt the Svg group positions to the current view box dimensions
   */
  protected refreshGroupPosition() {
    if (!this._annotationPenData) {
      return;
    }
    const page = this._pages.find(x => x.id === this._annotationPenData.id);
    if (!page) {
      // set scale to 0 to hide pen group if it's page is not rendered
      this._annotationPenData.setGroupMatrix(
        [0, 0, 0, 0, 0, 0]);
      return;
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
    this.refreshGroupPosition();
  }
  
  protected onPointerDown = (e: PointerEvent) => {
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
    target.addEventListener("pointermove", this.onPointerMove);
    target.addEventListener("pointerup", this.onPointerUp);    
    target.addEventListener("pointerout", this.onPointerUp);  
    // capture pointer to make pointer events fire on same target
    target.setPointerCapture(e.pointerId);
  };

  protected onPointerMove = (e: PointerEvent) => {
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

  protected onPointerUp = (e: PointerEvent) => {
    if (!e.isPrimary) {
      return;
    }

    const target = e.target as HTMLElement;
    target.removeEventListener("pointermove", this.onPointerMove);
    target.removeEventListener("pointerup", this.onPointerUp);    
    target.removeEventListener("pointerout", this.onPointerUp);
    target.releasePointerCapture(e.pointerId);   

    this._annotationPenData?.endPath();
    this.emitPathCount();
  };

  protected emitPathCount() {
    this._docData.eventController.dispatchEvent(new PenDataChangeEvent({
      pathCount: this._annotationPenData?.pathCount || 0,
    }));
  }

  protected buildAnnotationDto(data: PenData): InkAnnotationDto {
    const positions: Vec2[] = [];
    const inkList: number[][] = [];
    data.paths.forEach(path => {
      const ink: number[] = [];
      path.positions.forEach(pos => {
        positions.push(pos);
        ink.push(pos.x, pos.y);
      });
      inkList.push(ink);
    });
    const {min: newRectMin, max: newRectMax} = 
      vecMinMax(...positions);  
    const w = data.strokeWidth; 
    const rect: Quadruple = [
      newRectMin.x - w / 2, 
      newRectMin.y - w / 2, 
      newRectMax.x + w / 2, 
      newRectMax.y + w / 2,
    ];

    const nowString = new Date().toISOString();
    const dto: InkAnnotationDto = {
      uuid: getRandomUuid(),
      annotationType: "/Ink",
      pageId: null,

      dateCreated: nowString,
      dateModified: nowString,
      author: this._docData.userName || "unknown",

      rect,
      matrix: [1, 0, 0, 1, 0, 0],

      inkList,
      color: data.color,
      strokeWidth: data.strokeWidth,
      strokeDashGap: null,
    };

    return dto;
  }
}
