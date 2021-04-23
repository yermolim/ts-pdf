import { buildCloudCurveFromPolyline, getRandomUuid, Quadruple } from "../../common";
import { Vec2, vecMinMax } from "../../math";

import { DocumentData } from "../../document/document-data";
import { SquareAnnotationDto, SquareAnnotation } from "../../document/entities/annotations/markup/geometric/square-annotation";

import { PageView } from "../../components/pages/page-view";
import { GeometricAnnotator, GeometricAnnotatorOptions } from "./geometric-annotator";

export class GeometricSquareAnnotator extends GeometricAnnotator {
  /**last 'pointerdown' position in the page coordinate system */
  protected _down: Vec2;

  /**min and max rectangle corners in the page coordinate system */
  protected _rect: Quadruple;
  
  constructor(docData: DocumentData, parent: HTMLDivElement, pages: PageView[], options?: GeometricAnnotatorOptions) {
    super(docData, parent, pages, options || {});
    this.init();
  }

  destroy() {
    super.destroy();    
    this.emitPointCount(0);
  }  
  
  undo() {
    this.clear();
  }
  
  clear() {  
    this._rect = null;
    this.clearGroup();
    this.emitPointCount(0);
  }
  
  saveAnnotation() {
    if (!this._rect) {
      return;
    }

    const pageId = this._pageId;
    const dto = this.buildAnnotationDto();
    const annotation = SquareAnnotation.createFromDto(dto);

    // DEBUG
    // console.log(annotation);

    this._docData.appendAnnotationToPage(pageId, annotation);
    
    this.clear();
  }
  
  protected init() {
    super.init();

    this._overlay.addEventListener("pointerdown", 
      this.onPointerDown);
  }
  
  /**
   * clear the old svg rectangle if present and draw a new one instead
   * @param min rect corner with the minimal coordinate values
   * @param max rect corner with the maximal coordinate values
   */
  protected redrawRect(min: Vec2, max: Vec2) {
    this._svgGroup.innerHTML = "";

    const minSize = this._strokeWidth * 2;
    if (max.x - min.x <= minSize || max.y - min.y <= minSize) {
      // square is too small
      this._rect = null;
      return;
    }

    const [r, g, b, a] = this._color || [0, 0, 0, 1];
    this._rect = [min.x, min.y, max.x, max.y];

    if (this._cloudMode) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", `rgba(${r * 255},${g * 255},${b * 255},${a})`);
      path.setAttribute("stroke-width", this._strokeWidth + "");
      path.setAttribute("stroke-linecap", "round");      
      path.setAttribute("stroke-linejoin", "round");      

      const curveData = buildCloudCurveFromPolyline([
        new Vec2(min.x, min.y),
        new Vec2(min.x, max.y),
        new Vec2(max.x, max.y),
        new Vec2(max.x, min.y),
        new Vec2(min.x, min.y),
      ], SquareAnnotation.cloudArcSize);    
  
      let pathString = "M" + curveData.start.x + "," + curveData.start.y;
      curveData.curves.forEach(x => {
        pathString += ` C${x[0].x},${x[0].y} ${x[1].x},${x[1].y} ${x[2].x},${x[2].y}`;
      });
      path.setAttribute("d", pathString);

      this._svgGroup.append(path);
    } else {
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("fill", "none");
      rect.setAttribute("stroke", `rgba(${r * 255},${g * 255},${b * 255},${a})`);
      rect.setAttribute("stroke-width", this._strokeWidth + "");
      rect.setAttribute("x", min.x + "");
      rect.setAttribute("y", min.y + "");
      rect.setAttribute("width", max.x - min.x + "");
      rect.setAttribute("height", max.y - min.y + "");  
      this._svgGroup.append(rect);
    }
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
    this._pageId = pageId;
    this._down = new Vec2(px, py);

    this.clear();
    this.refreshGroupPosition();

    const target = e.target as HTMLElement;
    target.addEventListener("pointermove", this.onPointerMove);
    target.addEventListener("pointerup", this.onPointerUp);    
    target.addEventListener("pointerout", this.onPointerUp);  
    // capture pointer to make pointer events fire on same target
    target.setPointerCapture(e.pointerId);
  };

  protected onPointerMove = (e: PointerEvent) => {
    if (!e.isPrimary // the event caused not by primary pointer
      || !this._down // the pointer is not in the 'down' state
    ) {
      return;
    }

    const {clientX: cx, clientY: cy} = e;
    this.updatePointerCoords(cx, cy);

    const pageCoords = this._pointerCoordsInPageCS;    
    if (!pageCoords || pageCoords.pageId !== this._pageId) {
      // skip move if the pointer is outside of the starting page
      return;
    }

    const {pageX: px, pageY: py} = pageCoords;
    const {min, max} = vecMinMax(this._down, new Vec2(px, py));
        
    this.redrawRect(min, max);
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
    
    if (this._rect) {
      this.emitPointCount(2);
    }
  };
  
  protected buildAnnotationDto(): SquareAnnotationDto {
    const margin = this._strokeWidth / 2 + (this._cloudMode ? SquareAnnotation.cloudArcSize / 2 : 0);
    // separate variables to allow further changes of the margin calculation logic
    const lm = margin;
    const tm = margin;
    const rm = margin;
    const bm = margin;

    const rectMargins: Quadruple = [lm, tm, rm, bm];
    const [xmin, ymin, xmax, ymax] = this._rect;

    const nowString = new Date().toISOString();
    const dto: SquareAnnotationDto = {
      uuid: getRandomUuid(),
      annotationType: "/Square",
      pageId: null,

      dateCreated: nowString,
      dateModified: nowString,
      author: this._docData.userName || "unknown",

      rect: [xmin - lm, ymin - bm, xmax + rm, ymax + tm],
      rectMargins,

      cloud: this._cloudMode,
      color: this._color,
      strokeWidth: this._strokeWidth,
      strokeDashGap: null,
    };

    return dto;
  }
}
