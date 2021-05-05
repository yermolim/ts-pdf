import { Octuple } from "../../common/types";
import { TextSelectionInfo } from "../../common/text-selection";
import { getRandomUuid } from "../../common/uuid";

import { PageService } from "../../services/page-service";
import { DocumentService } from "../../services/document-service";

import { TextMarkupAnnotationDto } from "../../document/entities/annotations/markup/text-markup/text-markup-annotation";
import { HighlightAnnotation } from "../../document/entities/annotations/markup/text-markup/highlight-annotation";

import { textSelectionChangeEvent, TextSelectionChangeEvent } from "../annotator";
import { TextAnnotatorOptions } from "./text-annotator";
import { TextMarkupAnnotator } from "./text-markup-annotator";

export class TextHighlightAnnotator extends TextMarkupAnnotator {
  protected readonly _highlightsByPageId = new Map<number, Octuple[]>();
  
  constructor(docService: DocumentService, pageService: PageService, 
    parent: HTMLDivElement, options?: TextAnnotatorOptions) {
    super(docService, pageService, parent, options || {});
    this.init();
  }

  destroy() {
    super.destroy();
    this._docService.eventService.removeListener(textSelectionChangeEvent,
      this.onTextSelectionChange);
  }  
  
  undo() {
    this.clear();
  }
  
  clear() {  
    this._highlightsByPageId.clear();
    this.clearGroup();
  }
  
  saveAnnotation() {
    if (!this._highlightsByPageId.size) {
      return;
    }

    const dtos = this.buildAnnotationDtos();
    dtos.forEach(dto => {
      const annotation = HighlightAnnotation.createFromDto(dto);
      // DEBUG
      // console.log(annotation);
      this._docService.appendAnnotationToPage(dto.pageId, annotation);
    });
    
    this.clear();
  }
  
  protected init() {
    super.init();
    this._docService.eventService.addListener(textSelectionChangeEvent,
      this.onTextSelectionChange);
  }
   
  /**
   * clear the old svg highlights if present and draw new ones instead
   */
  protected redraw() {
    const [r, g, b, a] = this._color || [0, 0, 0, 1];

    this._svgGroupByPageId.forEach((group, pageId) => {
      group.innerHTML = "";

      const quads = this._highlightsByPageId.get(pageId);
      if (quads?.length) {
        quads.forEach(quad => {
          const [x3, y3, x2, y2, x0, y0, x1, y1] = quad;
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("fill", `rgba(${r * 255},${g * 255},${b * 255},${a})`);
          path.setAttribute("stroke", "none");
          path.setAttribute("d", `M ${x0},${y0} L ${x1},${y1} L ${x2},${y2} L ${x3},${y3} Z`);    
          group.append(path);
        });
      }
    });
  }

  protected updateHighlights(selections: TextSelectionInfo[]) {
    this._highlightsByPageId.clear();    
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
      if (this._highlightsByPageId.has(pageId)) {
        this._highlightsByPageId.get(pageId).push(quadPoints);
      } else {
        this._highlightsByPageId.set(pageId, [quadPoints]);
      }
    }    

    this.redraw();    
    
    if (this._highlightsByPageId?.size) {
      this.emitDataChanged(this._highlightsByPageId.size, true, true);
    } else {
      this.emitDataChanged(0);
    }
  }

  protected onTextSelectionChange = (e: TextSelectionChangeEvent) => {
    this.updateHighlights(e?.detail?.selectionInfos || []);
  };
    
  protected buildAnnotationDtos(): TextMarkupAnnotationDto[] {
    const nowString = new Date().toISOString();
    const dtos: TextMarkupAnnotationDto[] = [];    

    this._highlightsByPageId.forEach((quads, pageId) => {
      const dto: TextMarkupAnnotationDto = {
        uuid: getRandomUuid(),
        annotationType: "/Highlight",
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
}
