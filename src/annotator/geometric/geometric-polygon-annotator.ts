import { getRandomUuid } from "../../common/uuid";
import { Vec2 } from "../../common/math";
import { buildCloudCurveFromPolyline } from "../../drawing/clouds";

import { PageService } from "../../services/page-service";
import { DocumentService } from "../../services/document-service";

import { GeometricAnnotator, GeometricAnnotatorOptions } from "./geometric-annotator";
import { PolygonAnnotation, PolygonAnnotationDto } 
  from "../../document/entities/annotations/markup/geometric/polygon-annotation";

export class GeometricPolygonAnnotator extends GeometricAnnotator {  
  /**points in the page coordinate system */
  protected readonly _points: Vec2[] = [];
  
  constructor(docService: DocumentService, pageService: PageService, 
    parent: HTMLDivElement, options?: GeometricAnnotatorOptions) {
    super(docService, pageService, parent, options || {});
    this.init();
  }

  destroy() {
    super.destroy();
  }  
  
  undo() {
    if (this._points.length) {
      this._points.pop();
      this.redraw();
      this.emitPointsDataChanged();
    }
  }
  
  clear() {  
    if (this._points?.length) {
      this._points.length = 0;
      this.clearGroup();
    }
  }
  
  saveAnnotation() {
    if (this._points.length < 3) {
      // polygon can't contain less than 3 points
      return;
    }

    const pageId = this._pageId;
    const dto = this.buildAnnotationDto();
    const annotation = PolygonAnnotation.createFromDto(dto);

    // DEBUG
    // console.log(annotation);

    this._docService.appendAnnotationToPageAsync(pageId, annotation);
    
    this.clear();
  }

  protected init() {
    super.init();

    this._overlay.addEventListener("pointerdown", 
      this.onPointerDown);
  }

  protected emitPointsDataChanged() {    
    const count = this._points.length;
    this.emitDataChanged(count, count > 1, count > 0, count > 2);
  }
    
  protected redraw() {
    this._svgGroup.innerHTML = "";

    if (this._points.length < 2) {
      return;
    }

    const [r, g, b, a] = this._color || [0, 0, 0, 1];

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", `rgba(${r * 255},${g * 255},${b * 255},${a})`);
    path.setAttribute("stroke-width", this._strokeWidth + "");
    let pathString: string;
    if (this._cloudMode) {
      path.setAttribute("stroke-linecap", "round");      
      path.setAttribute("stroke-linejoin", "round");      

      const curveData = buildCloudCurveFromPolyline([...this._points, this._points[0]], 
        PolygonAnnotation.cloudArcSize);    
  
      pathString = "M" + curveData.start.x + "," + curveData.start.y;
      curveData.curves.forEach(x => {
        pathString += ` C${x[0].x},${x[0].y} ${x[1].x},${x[1].y} ${x[2].x},${x[2].y}`;
      });
      path.setAttribute("d", pathString);

    } else {
      path.setAttribute("stroke-linecap", "square");      
      path.setAttribute("stroke-linejoin", "miter");
      
      const start = this._points[0];
      pathString = "M" + start.x + "," + start.y;
      for (let i = 1; i < this._points.length; i++) {
        const point = this._points[i];
        pathString += " L" + point.x + "," + point.y;
      }
      pathString += " Z";
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
    
    this.refreshGroupPosition();

    if (!this._points.length) {
      // add a starting point point
      this._points.push(new Vec2(px, py));
    }
    // add a temporary point
    this._points.push(new Vec2(px, py));

    const target = e.target as HTMLElement;
    target.addEventListener("pointermove", this.onPointerMove);
    target.addEventListener("pointerup", this.onPointerUp);    
    target.addEventListener("pointerout", this.onPointerUp);  
    // capture pointer to make pointer events fire on same target
    target.setPointerCapture(e.pointerId);
  };

  protected onPointerMove = (e: PointerEvent) => {
    if (!e.isPrimary) { // the event caused not by primary pointer
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
    // update last point (temp one)
    this._points[this._points.length - 1].set(px, py);
        
    this.redraw();
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
    
    this.emitPointsDataChanged();
  };
    
  protected buildAnnotationDto(): PolygonAnnotationDto {
    const margin = this._strokeWidth / 2 + (this._cloudMode ? PolygonAnnotation.cloudArcSize / 2 : 0);    
    let xmin: number;
    let ymin: number;
    let xmax: number;
    let ymax: number;
    let vec: Vec2;
    const points = this._points;
    const vertices: number[] = [];
    for (let i = 0; i < points.length; i++) {
      vec = points[i];      
      if (!xmin || vec.x < xmin) {
        xmin = vec.x;
      }
      if (!ymin || vec.y < ymin) {
        ymin = vec.y;
      }
      if (!xmax || vec.x > xmax) {
        xmax = vec.x;
      }
      if (!ymax || vec.y > ymax) {
        ymax = vec.y;
      }
      vertices.push(vec.x, vec.y);
    }

    const nowString = new Date().toISOString();
    const dto: PolygonAnnotationDto = {
      uuid: getRandomUuid(),
      annotationType: "/Polygon",
      pageId: null,

      dateCreated: nowString,
      dateModified: nowString,
      author: this._docService.userName || "unknown",
      
      textContent: null,

      rect: [xmin - margin, ymin - margin, xmax + margin, ymax + margin],

      vertices,

      cloud: this._cloudMode,
      color: this._color,
      strokeWidth: this._strokeWidth,
      strokeDashGap: null,
    };

    return dto;
  }
}
