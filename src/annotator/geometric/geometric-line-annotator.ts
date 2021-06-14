import { Quadruple } from "../../common/types";
import { Vec2 } from "mathador";
import { getRandomUuid } from "../../common/uuid";

import { PageService } from "../../services/page-service";
import { DocumentService } from "../../services/document-service";
import { LineAnnotation, LineAnnotationDto, lineIntents } from "../../document/entities/annotations/markup/geometric/line-annotation";

import { GeometricAnnotator, GeometricAnnotatorOptions } from "./geometric-annotator";

export class GeometricLineAnnotator extends GeometricAnnotator {
  /**last 'pointerdown' position in the page coordinate system */
  protected _down: Vec2;
  
  /**segment end positions in the page coordinate system */
  protected _vertices: Quadruple;
  
  constructor(docService: DocumentService, pageService: PageService, 
    parent: HTMLDivElement, options?: GeometricAnnotatorOptions) {
    super(docService, pageService, parent, options || {});
    this.init();
  }

  override destroy() {
    super.destroy();
  }  
  
  undo() {
    this.clear();
  }
  
  clear() {  
    this._vertices = null;
    this.clearGroup();
  }
  
  async saveAnnotationAsync() {
    if (!this._vertices) {
      return;
    }

    const pageId = this._pageId;
    const dto = this.buildAnnotationDto();
    const annotation = await LineAnnotation.createFromDtoAsync(dto, this._docService.fontMap);
    // DEBUG
    // console.log(annotation);

    await this._docService.appendAnnotationToPageAsync(pageId, annotation);
    
    this.clear();
  }
  
  protected override init() {
    super.init();

    this._overlay.addEventListener("pointerdown", 
      this.onPointerDown);
  }
   
  /**
   * clear the old svg line if present and draw a new one instead
   * @param min segment start
   * @param max segment end
   */
  protected redrawLine(min: Vec2, max: Vec2) {
    this._svgGroup.innerHTML = "";

    const [r, g, b, a] = this._color || [0, 0, 0, 1];
    this._vertices = [min.x, min.y, max.x, max.y];

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", `rgba(${r * 255},${g * 255},${b * 255},${a})`);
    path.setAttribute("stroke-width", this._strokeWidth + "");
    path.setAttribute("stroke-linecap", "square"); 

    const pathString = `M ${min.x},${min.y} L ${max.x},${max.y}`;
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
    const end = new Vec2(px, py);
        
    this.redrawLine(this._down, end);
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
    
    if (this._vertices) {
      this.emitDataChanged(2, true, true);
    }
  };
  
  protected buildAnnotationDto(): LineAnnotationDto {
    const nowString = new Date().toISOString();
    const dto: LineAnnotationDto = {
      uuid: getRandomUuid(),
      annotationType: "/Line",
      pageId: null,

      dateCreated: nowString,
      dateModified: nowString,
      author: this._docService.userName || "unknown",
      
      textContent: null,

      rect: null,
      vertices: this._vertices,
      intent: lineIntents.DIMENSION,

      color: this._color,
      strokeWidth: this._strokeWidth,
      strokeDashGap: null,
    };

    return dto;
  }
}
