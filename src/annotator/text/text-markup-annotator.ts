import { Octuple } from "../../common/types";
import { TextSelectionInfo } from "../../common/text-selection";
import { getRandomUuid } from "../../common/uuid";

import { PageService } from "../../services/page-service";
import { DocumentService } from "../../services/document-service";

import { TextMarkupAnnotationDto } 
  from "../../document/entities/annotations/markup/text-markup/text-markup-annotation";

import { textSelectionChangeEvent, TextSelectionChangeEvent } from "../annotator";
import { TextAnnotator, TextAnnotatorOptions } from "./text-annotator";

export abstract class TextMarkupAnnotator extends TextAnnotator {  
  /**current svg groups by page id */
  protected readonly _svgGroupByPageId = new Map<number, SVGGraphicsElement>();
  
  /**text selection corner coordinates by page identifier */
  protected readonly _coordsByPageId = new Map<number, Octuple[]>();
  
  protected constructor(docService: DocumentService, pageService: PageService, 
    parent: HTMLDivElement, options: TextAnnotatorOptions) {
    super(docService, pageService, parent, options);
  }

  destroy() {
    this._docService.eventService.removeListener(textSelectionChangeEvent,
      this.onTextSelectionChange);
    this.clearGroup();
      
    super.destroy();
  }
  
  undo() {
    this.clear();
  }
  
  clear() {  
    this._coordsByPageId.clear();
    this.clearGroup();
  }

  protected init() {
    super.init();
    this._docService.eventService.addListener(textSelectionChangeEvent,
      this.onTextSelectionChange);
  }

  protected clearGroup() {
    this._svgGroupByPageId.forEach(x => x.innerHTML = "");
    this.emitDataChanged(0);
  }

  protected refreshGroupPosition() {
    const {height: overlayHeight, top: overlayTop, left: overlayLeft} = 
      this._overlay.getBoundingClientRect();
    const overlayBottom = overlayTop + overlayHeight;
    const scale = this._pageService.scale;

    this._pageService.renderedPages.forEach(x => {
      const {height: pageHeight, width: pageWidth, top: pageTop, left: pageLeft} = 
        x.viewContainer.getBoundingClientRect();
      const pageBottom = pageTop + pageHeight;
      const pageRight = pageLeft + pageWidth;
      const rotation = x.rotation;
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
      
      let svg: SVGGraphicsElement;
      if (this._svgGroupByPageId.has(x.id)) {
        svg = this._svgGroupByPageId.get(x.id);  
      } else {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this._svgGroupByPageId.set(x.id, svg);
        this._svgGroup.append(svg);
      }    
      svg.setAttribute("transform",
        `translate(${offsetX} ${offsetY}) rotate(${-rotation})`);     
    });
  }
  
  protected updateCoords(selections: TextSelectionInfo[]) {
    this._coordsByPageId.clear();    
    for (const selection of selections) { 
      const bl = this._pageService.getPageCoordsUnderPointer(
        selection.bottomLeft.x, selection.bottomLeft.y);
      const br = this._pageService.getPageCoordsUnderPointer(
        selection.bottomRight.x, selection.bottomRight.y);
      const tr = this._pageService.getPageCoordsUnderPointer(
        selection.topRight.x, selection.topRight.y);
      const tl = this._pageService.getPageCoordsUnderPointer(
        selection.topLeft.x, selection.topLeft.y);

      if (!bl || !br || !tr || !tl) {
        // at least one of the selection corners is outside the page
        // skip the current selection
        continue;
      }
      
      if (new Set<number>([bl.pageId, br.pageId, tr.pageId, tl.pageId]).size > 1) {
        // shall not ever happen
        throw new Error("Not all the text selection corners are inside the same page");
      }

      // the order from PDF spec is "bottom-left->bottom-right->top-right->top-left"
      // but the actual order used ubiquitously is "top-left->top-right->bottom-left->bottom-right"
      // so use the second one
      const quadPoints: Octuple = [
        tl.pageX, tl.pageY,
        tr.pageX, tr.pageY,
        bl.pageX, bl.pageY,
        br.pageX, br.pageY,
      ];

      const pageId = bl.pageId;
      if (this._coordsByPageId.has(pageId)) {
        this._coordsByPageId.get(pageId).push(quadPoints);
      } else {
        this._coordsByPageId.set(pageId, [quadPoints]);
      }
    }    

    this.redraw();    
    
    if (this._coordsByPageId?.size) {
      this.emitDataChanged(this._coordsByPageId.size, true, true);
    } else {
      this.emitDataChanged(0);
    }
  }

  protected onTextSelectionChange = (e: TextSelectionChangeEvent) => {
    this.updateCoords(e?.detail?.selectionInfos || []);
  };
  
  protected buildAnnotationDtos(type: "/Highlight" | "/Strikeout" | "/Underline" | "/Squiggly"): 
  TextMarkupAnnotationDto[] {
    const nowString = new Date().toISOString();
    const dtos: TextMarkupAnnotationDto[] = [];    

    this._coordsByPageId.forEach((quads, pageId) => {
      const dto: TextMarkupAnnotationDto = {
        uuid: getRandomUuid(),
        annotationType: type,
        pageId,
  
        dateCreated: nowString,
        dateModified: nowString,
        author: this._docService.userName || "unknown",
        
        textContent: null,
  
        rect: null,
        quadPoints: quads.flat(),
  
        color: this._color,
        strokeWidth: this._strokeWidth,
        strokeDashGap: null,
      }; 
      dtos.push(dto);     
    });

    return dtos;
  }

  protected abstract redraw(): void;
}
