import { PageService } from "../../services/page-service";
import { DocumentService } from "../../services/document-service";

import { UnderlineAnnotation } 
  from "../../document/entities/annotations/markup/text-markup/underline-annotation";

import { TextAnnotatorOptions } from "./text-annotator";
import { TextMarkupAnnotator } from "./text-markup-annotator";

export class TextUnderlineAnnotator extends TextMarkupAnnotator {

  constructor(docService: DocumentService, pageService: PageService, 
    parent: HTMLDivElement, options?: TextAnnotatorOptions) {
    super(docService, pageService, parent, options || {});
    this.init();
  }
  
  async saveAnnotationAsync() {
    if (!this._coordsByPageId.size) {
      return;
    }

    const dtos = this.buildAnnotationDtos("/Underline");
    for (const dto of dtos) {
      const annotation = UnderlineAnnotation.createFromDto(dto);
      // DEBUG
      // console.log(annotation);
      await this._docService.appendAnnotationToPageAsync(dto.pageId, annotation);
    }
    
    this.clear();
  }
   
  /**
   * clear the old svg if present and draw new ones instead
   */
  protected redraw() {
    const [r, g, b, a] = this._color || [0, 0, 0, 1];

    this._svgGroupByPageId.forEach((group, pageId) => {
      group.innerHTML = "";

      const quads = this._coordsByPageId.get(pageId);
      if (quads?.length) {
        quads.forEach(quad => {
          const [, , , , x0, y0, x1, y1] = quad;

          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("fill", "none");
          path.setAttribute("stroke", `rgba(${r * 255},${g * 255},${b * 255},${a})`);
          path.setAttribute("stroke-width", this._strokeWidth + "");
          path.setAttribute("stroke-linecap", "square");
          path.setAttribute("d", `M ${x0},${y0} L ${x1},${y1}`); 
          group.append(path);
        });
      }
    });
  }
}
