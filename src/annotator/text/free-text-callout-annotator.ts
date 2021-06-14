import { Vec2 } from "mathador";
import { Double, Quadruple } from "../../common/types";
import { getRandomUuid } from "../../common/uuid";
import { lineEndingMinimalSize, lineEndingMultiplier } from "../../drawing/utils";

import { DocumentService } from "../../services/document-service";
import { PageService } from "../../services/page-service";
import { Viewer } from "../../components/viewer";

import { lineEndingTypes, freeTextIntents } from "../../document/spec-constants";
import { FreeTextAnnotation, FreeTextAnnotationDto, FreeTextAnnotPointsDto } 
  from "../../document/entities/annotations/markup/free-text-annotation";

import { TextAnnotator, TextAnnotatorOptions } from "./text-annotator";

export class FreeTextCalloutAnnotator extends TextAnnotator {
  protected readonly _viewer: Viewer;

  protected _pageId: number;
  
  /**last 'pointerdown' position in the page coordinate system */
  protected _down: Vec2;
  /**min and max rectangle corners in the page coordinate system */
  protected _rect: Quadruple;
  /**future annotation key points */
  protected _points: FreeTextAnnotPointsDto;

  constructor(docService: DocumentService, pageService: PageService, 
    viewer: Viewer, options?: TextAnnotatorOptions) {
    super(docService, pageService, viewer.container, options || {});
    this._viewer = viewer;
    this.init();
  }

  override destroy() {    
    this.emitDataChanged(0);
    super.destroy();
  }

  undo() {
    this.clear();
  }

  clear() {
    this._rect = null;
    this._points = null;
    this._svgGroup.innerHTML = "";
    this.emitDataChanged(0);
  }

  /**saves the current temp annotation to the document data */
  async saveAnnotationAsync() {
    if (!this._pageId || !this._rect) {
      return;
    }

    const text = await this._viewer.showTextDialogAsync("");
    if (text !== null) {
      const pageId = this._pageId;
      const dto = this.buildAnnotationDto(text);
      if (dto) {
        const annotation = await FreeTextAnnotation.createFromDtoAsync(dto, this._docService.fontMap);
        // DEBUG
        // console.log(annotation);
    
        // append the current temp annotation to the page
        await this._docService.appendAnnotationToPageAsync(pageId, annotation);
      }
    }
    
    this.clear();
  }
  
  protected override init() {
    super.init();
    this._overlay.addEventListener("pointerdown", 
      this.onPointerDown);
  }

  protected initPoints() {    
    const [xmin, ymin, xmax, ymax] = this._rect;
    const horCenterX = (xmin + xmax) / 2;
    const vertCenterY = (ymin + ymax) / 2;    
    const points: FreeTextAnnotPointsDto = {
      bl: [xmin, ymin], 
      tr: [xmax, ymax],
      br: [xmax, ymin],
      tl: [xmin, ymax],    
      l: [xmin, vertCenterY],
      t: [horCenterX, ymax], 
      r: [xmax, vertCenterY],
      b: [horCenterX, ymin],
    };

    this._points = points;
    this.emitDataChanged(2, true, true);
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

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("fill", "white");
    rect.setAttribute("stroke", `rgba(${r * 255},${g * 255},${b * 255},${a})`);
    rect.setAttribute("stroke-width", this._strokeWidth + "");
    rect.setAttribute("x", min.x + "");
    rect.setAttribute("y", min.y + "");
    rect.setAttribute("width", max.x - min.x + "");
    rect.setAttribute("height", max.y - min.y + "");  
    this._svgGroup.append(rect);
  }

  protected redrawCallout() {
    // pop the rect svg from group
    const svgRect = this._svgGroup.lastChild;
    svgRect.remove();
    // clear group content
    this._svgGroup.innerHTML = "";
    
    const [r, g, b, a] = this._color || [0, 0, 0, 1];
    const callout = document.createElementNS("http://www.w3.org/2000/svg", "path");
    callout.setAttribute("fill", "none");
    callout.setAttribute("stroke", `rgba(${r * 255},${g * 255},${b * 255},${a})`);
    callout.setAttribute("stroke-width", this._strokeWidth + "");
    let d = `M${this._points.cob[0]},${this._points.cob[1]} `;
    if (this._points.cok) {
      d += `L${this._points.cok[0]},${this._points.cok[1]} `;
    }
    d += `L${this._points.cop[0]},${this._points.cop[1]}`;
    callout.setAttribute("d", d);

    this._svgGroup.append(callout);

    // append the rect svg back to group
    this._svgGroup.append(svgRect);
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
    if (pageId !== this._pageId) {
      this.clear();
    }
    this._pageId = pageId;
    this._down = new Vec2(px, py);

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
     
    if (!this._points) {    
      const pageCoords = this._pointerCoordsInPageCS;    
      if (!pageCoords || pageCoords.pageId !== this._pageId) {
        // skip move if the pointer is outside of the starting page
        return;
      }
      const {pageX: px, pageY: py} = pageCoords;
      const {min, max} = Vec2.minMax(this._down, new Vec2(px, py));
      this.redrawRect(min, max);
    }
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

    if (!this._rect) {
      return;
    }
    
    if (!this._points) {
      this.initPoints();
      return;
    }   

    const pageCoords = this._pointerCoordsInPageCS;    
    if (!pageCoords || pageCoords.pageId !== this._pageId) {
      // skip action if the pointer is outside of the starting page
      return;
    }

    const {pageX: px, pageY: py} = pageCoords; 
    const p = new Vec2(px, py);

    // get the nearest side center and setting callout start to it
    const {l, b, r, t} = this._points;
    const lv = new Vec2(l[0], l[1]);
    const bv = new Vec2(b[0], b[1]);
    const rv = new Vec2(r[0], r[1]);
    const tv = new Vec2(t[0], t[1]);
    let cob = lv;
    let minDistance = Vec2.subtract(p, lv).getMagnitude();
    const bvToP = Vec2.subtract(p, bv).getMagnitude();
    if (bvToP < minDistance) {
      minDistance = bvToP;
      cob = bv;
    }
    const rvToP = Vec2.subtract(p, rv).getMagnitude();
    if (rvToP < minDistance) {
      minDistance = rvToP;
      cob = rv;
    }
    const tvToP = Vec2.subtract(p, tv).getMagnitude();
    if (tvToP < minDistance) {
      minDistance = tvToP;
      cob = tv;
    }

    this._points.cob = <Double><any>cob.toFloatArray();
    if (!this._points.cop) {
      this._points.cop = <Double><any>p.toFloatArray();
    } else {
      this._points.cok = <Double><any>p.toFloatArray();
    }
    this.redrawCallout();
  };

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
  
  protected buildAnnotationDto(text: string): FreeTextAnnotationDto {    
    // calculate margin
    let margin: number;
    if (this._points.cob) {
      // annotation has a callout with special line ending
      const endingSizeWoStroke = Math.max(
        this._strokeWidth * lineEndingMultiplier, lineEndingMinimalSize);
      // '+ strokeWidth' is used to include the ending figure stroke width
      const endingSize = endingSizeWoStroke + this._strokeWidth;
      margin = endingSize / 2;      
    } else {
      margin = this._strokeWidth / 2;
    }
    // separate variables to allow further changes of the margin calculation logic
    const lm = margin;
    const tm = margin;
    const rm = margin;
    const bm = margin;
    const {bl, tr, br, tl, l, t, r, b, cob, cok, cop} = this._points;
    const {min, max} = Vec2.minMax(
      new Vec2(bl[0], bl[1]), 
      new Vec2(tr[0], tr[1]),
      new Vec2(br[0], br[1]),
      new Vec2(tl[0], tl[1]),    
      new Vec2(l[0], l[1]),
      new Vec2(t[0], t[1]), 
      new Vec2(r[0], r[1]),
      new Vec2(b[0], b[1]),    
      // TODO: replace after updating Mathador
      cob ? new Vec2(cob[0], cob[1]) : new Vec2(bl[0], bl[1]), // : null,
      cok ? new Vec2(cok[0], cok[1]) : new Vec2(bl[0], bl[1]), // : null,
      cop ? new Vec2(cop[0], cop[1]) : new Vec2(bl[0], bl[1]), // : null,      
    );

    const nowString = new Date().toISOString();
    const dto: FreeTextAnnotationDto = {
      uuid: getRandomUuid(),
      annotationType: "/FreeText",
      pageId: null,

      dateCreated: nowString,
      dateModified: nowString,
      author: this._docService.userName || "unknown",
      
      textContent: text,

      rect: [min.x - lm, min.y - bm, max.x + rm, max.y + tm],
      points: this._points,

      intent: this._points.cob ? freeTextIntents.WITH_CALLOUT : freeTextIntents.PLAIN_TEXT,
      calloutEndingType: this._points.cob ? lineEndingTypes.ARROW_OPEN : null,

      // opacity should be 1
      color: [this._color[0], this._color[1], this._color[2], 1],
      strokeWidth: this._strokeWidth,
      strokeDashGap: null,
    };

    return dto;
  }
}
