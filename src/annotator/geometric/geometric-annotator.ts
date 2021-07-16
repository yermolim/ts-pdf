import { Vec2 } from "mathador";

import { Quadruple } from "../../common/types";
import { LINE_END_MULTIPLIER, LINE_END_MIN_SIZE, BEZIER_CONSTANT } from "../../drawing/utils";

import { DocumentService } from "../../services/document-service";
import { PageService } from "../../services/page-service";
import { LineEndingType, lineEndingTypes } from "../../document/spec-constants";

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
  
  override destroy() {
    this.clearGroup();
    super.destroy();
  }

  protected override init() {
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

  protected buildLineEndingPath(point: Vec2, type: LineEndingType, 
    strokeWidth: number, side: "left" | "right"): string {
    const size = Math.max(strokeWidth * LINE_END_MULTIPLIER, 
      LINE_END_MIN_SIZE);
    let text = "";
    switch (type) {
      case lineEndingTypes.ARROW_OPEN:
        if (side === "left") {      
          text += `M${point.x + size},${point.y + size / 2}`;
          text += ` L${point.x},${point.y}`;
          text += ` L${point.x + size},${point.y - size / 2}`;
        } else {
          text += `M${point.x - size},${point.y + size / 2}`;
          text += ` L${point.x},${point.y}`;
          text += ` L${point.x - size},${point.y - size / 2}`;
        }
        return text;
      case lineEndingTypes.ARROW_OPEN_R:
        if (side === "left") {      
          text += `M${point.x},${point.y + size / 2}`;
          text += ` L${point.x + size},${point.y}`;
          text += ` L${point.x},${point.y - size / 2}`;
        } else {
          text += `M${point.x},${point.y + size / 2}`;
          text += ` L${point.x - size},${point.y}`;
          text += ` L${point.x},${point.y - size / 2}`;
        }
        return text;
      case lineEndingTypes.ARROW_CLOSED:
        if (side === "left") {      
          text += `M${point.x + size},${point.y + size / 2}`;
          text += ` L${point.x},${point.y}`;
          text += ` L${point.x + size},${point.y - size / 2}`;
        } else {
          text += `M${point.x - size},${point.y + size / 2}`;
          text += ` L${point.x},${point.y}`;
          text += ` L${point.x - size},${point.y - size / 2}`;
        }
        text += " Z";
        return text;
      case lineEndingTypes.ARROW_CLOSED_R:
        if (side === "left") {  
          text += `M${point.x + size},${point.y}`; 
          text += ` L${point.x},${point.y + size / 2}`;
          text += ` L${point.x},${point.y - size / 2}`;
        } else { 
          text += `M${point.x - size},${point.y}`;
          text += ` L${point.x},${point.y - size / 2}`;
          text += ` L${point.x},${point.y + size / 2}`;
        }
        text += " Z";
        return text;
      case lineEndingTypes.BUTT:     
        text += `M${point.x},${point.y + size / 2}`;
        text += ` L${point.x},${point.y - size / 2}`;
        return text;
      case lineEndingTypes.SLASH:     
        text += `M${point.x + size / 2},${point.y + size / 2}`;
        text += ` L${point.x - size / 2},${point.y - size / 2}`;
        return text;        
      case lineEndingTypes.DIAMOND:     
        text += `M${point.x},${point.y + size / 2}`;
        text += ` L${point.x + size / 2},${point.y}`;
        text += ` L${point.x},${point.y - size / 2}`;
        text += ` L${point.x - size / 2},${point.y}`;
        text += " Z";
        return text;       
      case lineEndingTypes.SQUARE:     
        text += `M${point.x - size / 2},${point.y + size / 2}`;
        text += ` L${point.x + size / 2},${point.y + size / 2}`;
        text += ` L${point.x + size / 2},${point.y - size / 2}`;
        text += ` L${point.x - size / 2},${point.y - size / 2}`;
        text += " Z";
        return text;       
      case lineEndingTypes.CIRCLE:
        const c = BEZIER_CONSTANT;
        const r = size / 2;       
        const cw = c * r;
        const xmin = point.x - r;
        const ymin = point.y - r;
        const xmax = point.x + r;
        const ymax = point.y + r;
        // drawing four cubic bezier curves starting at the top tangent
        text += `M${point.x},${ymax}`;
        text += ` C${point.x + cw},${ymax} ${xmax},${point.y + cw} ${xmax},${point.y}`;
        text += ` C${xmax},${point.y - cw} ${point.x + cw},${ymin} ${point.x},${ymin}`;
        text += ` C${point.x - cw},${ymin} ${xmin},${point.y - cw} ${xmin},${point.y}`;
        text += ` C${xmin},${point.y + cw} ${point.x - cw},${ymax} ${point.x},${ymax}`;
        text += " Z";
        return text;
      case lineEndingTypes.NONE:
      default:
        return "";
    }
  }
  
  abstract override undo(): void;
  
  abstract override clear(): void;
  
  abstract override saveAnnotationAsync(): Promise<void>;
}
