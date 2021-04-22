import { buildCloudCurveFromEllipse, getRandomUuid, Quadruple } from "../../common";
import { Vec2, vecMinMax } from "../../math";

import { DocumentData } from "../../document/document-data";
import { CircleAnnotation, CircleAnnotationDto } from "../../document/entities/annotations/markup/geometric/circle-annotation";

import { PageView } from "../../components/pages/page-view";
import { GeometricAnnotator, GeometricAnnotatorOptions } from "./geometric-annotator";

export class GeometricCircleAnnotator extends GeometricAnnotator {
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
    const annotation = CircleAnnotation.createFromDto(dto);

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
   * clear the old svg circle if present and draw a new one instead
   * @param min rect corner with the minimal coordinate values
   * @param max rect corner with the maximal coordinate values
   */
  protected redrawCircle(min: Vec2, max: Vec2) {
    this._svgGroup.innerHTML = "";

    const minSize = this._strokeWidth * 2;
    if (max.x - min.x <= minSize || max.y - min.y <= minSize) {
      // circle is too small
      this._rect = null;
      return;
    }

    const [r, g, b, a] = this._color || [0, 0, 0, 1];
    this._rect = [min.x, min.y, max.x, max.y];

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", `rgba(${r * 255},${g * 255},${b * 255},${a})`);
    path.setAttribute("stroke-width", this._strokeWidth + "");
    path.setAttribute("stroke-linecap", "round");      
    path.setAttribute("stroke-linejoin", "round");   

    let pathString: string;
    const rx = (max.x - min.x) / 2;
    const ry = (max.y - min.y) / 2;
    const center = new Vec2(min.x + rx, min.y + ry);

    if (this._cloudMode) {
      const curveData = buildCloudCurveFromEllipse(rx, ry, center, CircleAnnotation.cloudArcSize);    
  
      pathString = "M" + curveData.start.x + "," + curveData.start.y;
      curveData.curves.forEach(x => {
        pathString += ` C${x[0].x},${x[0].y} ${x[1].x},${x[1].y} ${x[2].x},${x[2].y}`;
      });
    } else {      
      const c = CircleAnnotation.bezierConstant;
      const cw = c * rx;
      const ch = c * ry;
      // drawing four cubic bezier curves starting at the top tangent
      pathString = "M" + center.x + "," + max.y;
      pathString += ` C${center.x + cw},${max.y} ${max.x},${center.y + ch} ${max.x},${center.y}`;
      pathString += ` C${max.x},${center.y - ch} ${center.x + cw},${min.y} ${center.x},${min.y}`;
      pathString += ` C${center.x - cw},${min.y} ${min.x},${center.y - ch} ${min.x},${center.y}`;
      pathString += ` C${min.x},${center.y + ch} ${center.x - cw},${max.y} ${center.x},${max.y}`;
    }
    
    path.setAttribute("d", pathString);
    this._svgGroup.append(path);
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
        
    this.redrawCircle(min, max);
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
  
  protected buildAnnotationDto(): CircleAnnotationDto {
    const margin = this._strokeWidth / 2 + (this._cloudMode ? CircleAnnotation.cloudArcSize / 2 : 0);
    // separate variables to allow further changes of the margin calculation logic
    const lm = margin;
    const tm = margin;
    const rm = margin;
    const bm = margin;

    const rectMargins: Quadruple = [lm, tm, rm, bm];
    const [xmin, ymin, xmax, ymax] = this._rect;

    const nowString = new Date().toISOString();
    const dto: CircleAnnotationDto = {
      uuid: getRandomUuid(),
      annotationType: "/Square",
      pageId: null,

      dateCreated: nowString,
      dateModified: nowString,
      author: this._docData.userName || "unknown",

      rect: [xmin - lm, ymin - bm, xmax + rm, ymax + tm],
      rectMargins,
      matrix: [1, 0, 0, 1, 0, 0],

      cloud: this._cloudMode,
      color: this._color,
      strokeWidth: this._strokeWidth,
      strokeDashGap: null,
    };

    return dto;
  }
}
