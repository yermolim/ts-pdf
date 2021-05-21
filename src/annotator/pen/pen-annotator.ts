import { Vec2, vecMinMax } from "../../common/math";
import { Quadruple } from "../../common/types";
import { getRandomUuid } from "../../common/uuid";

import { DocumentService } from "../../services/document-service";
import { PageService } from "../../services/page-service";
import { InkAnnotation, InkAnnotationDto } from "../../document/entities/annotations/markup/ink-annotation";

import { Annotator, AnnotatorDataChangeEvent } from "../annotator";
import { SvgSmoothPath } from "../../drawing/paths/svg-smooth-path";

export interface PenAnnotatorOptions {
  strokeWidth?: number;  
  color?: Quadruple;
}

/**tool for adding ink (hand-drawn) annotations */
export class PenAnnotator extends Annotator {
  protected _annotationPathData: SvgSmoothPath;  
  protected _color: Quadruple;
  protected _strokeWidth: number;

  constructor(docService: DocumentService, pageService: PageService, parent: HTMLDivElement, 
    options?: PenAnnotatorOptions) {
    super(docService, pageService, parent);
    this.init();

    this._color = options?.color || [0, 0, 0, 0.9];
    this._strokeWidth = options?.strokeWidth || 3;
  }

  destroy() {   
    this.removeTempPenData();
    super.destroy();
  }

  /**remove the last path from the temp path group */
  undo() {
    this._annotationPathData?.removeLastPath();
    this.emitDataChanged();
  }

  /**clear the temp path group */
  clear() {
    this.removeTempPenData();
  }

  /**
   * save the current temp path as an ink annotation and append it to the page
   */
  saveAnnotation() {
    if (!this._annotationPathData) {
      return;
    }

    const pageId = this._annotationPathData.id;
    const dto = this.buildAnnotationDto(this._annotationPathData);
    const annotation = InkAnnotation.createFromDto(dto);

    // DEBUG
    // console.log(annotation);

    this._docService.appendAnnotationToPage(pageId, annotation);
    
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
    if (!this._annotationPathData) {
      return;
    }
    const page = this._pageService.renderedPages.find(x => x.id === this._annotationPathData.id);
    if (!page) {
      // set scale to 0 to hide pen group if it's page is not rendered
      this._annotationPathData.group.setAttribute("transform", "scale(0)");
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
    this._annotationPathData.group.setAttribute("transform",
      `translate(${offsetX} ${offsetY}) rotate(${-rotation})`);      
  }

  /**clear the temp path group */
  protected removeTempPenData() {
    if (this._annotationPathData) {
      this._annotationPathData.group.remove();
      this._annotationPathData = null;
      this.emitDataChanged();
    }    
  }

  /**
   * clear the current temp path group and create a new empty one instead
   * @param pageId 
   */
  protected resetTempPenData(pageId: number) {    
    this.removeTempPenData();    
    this._annotationPathData = new SvgSmoothPath({
      id: pageId, 
      color: this._color,
      strokeWidth: this._strokeWidth,
    });
    this._svgGroup.append(this._annotationPathData.group);

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
    if (!this._annotationPathData || pageId !== this._annotationPathData.id) {
      // the current page changed. reset the temp group
      this.resetTempPenData(pageId);
    }

    // create a new temp path
    this._annotationPathData.newPath(new Vec2(px, py));

    const target = e.target as HTMLElement;
    target.addEventListener("pointermove", this.onPointerMove);
    target.addEventListener("pointerup", this.onPointerUp);    
    target.addEventListener("pointerout", this.onPointerUp);  
    // capture pointer to make pointer events fire on same target
    target.setPointerCapture(e.pointerId);
  };

  protected onPointerMove = (e: PointerEvent) => {
    if (!e.isPrimary || !this._annotationPathData) {
      return;
    }

    const {clientX: cx, clientY: cy} = e;
    this.updatePointerCoords(cx, cy);

    const pageCoords = this._pointerCoordsInPageCS;
    if (!pageCoords || pageCoords.pageId !== this._annotationPathData.id) {
      // skip move if the pointer is outside of the starting page
      return;
    }
    
    // add the current pointer position to the current temp path
    this._annotationPathData.addPosition(new Vec2(pageCoords.pageX, pageCoords.pageY));
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

    this._annotationPathData?.endPath();
    this.emitDataChanged();
  };

  protected emitDataChanged() {
    const count = this._annotationPathData?.pathCount || 0;
    this._docService.eventService.dispatchEvent(new AnnotatorDataChangeEvent({
      annotatorType: "pen",
      elementCount: count,
      undoable: count > 1,
      clearable: count > 0,
      saveable: count > 0,
    }));
  }

  protected buildAnnotationDto(data: SvgSmoothPath): InkAnnotationDto {
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
    const halfW = data.strokeWidth / 2; 
    const rect: Quadruple = [
      newRectMin.x - halfW, 
      newRectMin.y - halfW, 
      newRectMax.x + halfW, 
      newRectMax.y + halfW,
    ];

    const nowString = new Date().toISOString();
    const dto: InkAnnotationDto = {
      uuid: getRandomUuid(),
      annotationType: "/Ink",
      pageId: null,

      dateCreated: nowString,
      dateModified: nowString,
      author: this._docService.userName || "unknown",
      
      textContent: null,

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
