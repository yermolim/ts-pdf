import { Octuple } from "../../common/types";

import { PageService } from "../../services/page-service";
import { DocumentService } from "../../services/document-service";

import { HighlightAnnotation } 
  from "../../document/entities/annotations/markup/text-markup/highlight-annotation";

import { TextAnnotatorOptions } from "./text-annotator";
import { TextMarkupAnnotator } from "./text-markup-annotator";

export class TextHighlightAnnotator extends TextMarkupAnnotator {
  
  constructor(docService: DocumentService, pageService: PageService, 
    parent: HTMLDivElement, options?: TextAnnotatorOptions) {
    super(docService, pageService, parent, options || {});
    this.init();
  }
  
  async saveAnnotationAsync() {
    if (!this._coordsByPageId.size) {
      return;
    }

    const dtos = this.buildAnnotationDtos("/Highlight");
    dtos.forEach(dto => {
      const annotation = HighlightAnnotation.createFromDto(dto);
      // DEBUG
      // console.log(annotation);
      this._docService.appendAnnotationToPageAsync(dto.pageId, annotation);
    });
    
    this.clear();
  }
   
  /**
   * clear the old svg highlights if present and draw new ones instead
   */
  protected redraw() {
    const [r, g, b, a] = this._color || [0, 0, 0, 1];

    this._svgGroupByPageId.forEach((group, pageId) => {
      group.innerHTML = "";

      const quads = this._coordsByPageId.get(pageId);
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
}
