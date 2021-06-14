import { Vec2 } from "mathador";
import { buildSquigglyLine } from "../../drawing/utils";

import { PageService } from "../../services/page-service";
import { DocumentService } from "../../services/document-service";

import { SquigglyAnnotation } 
  from "../../document/entities/annotations/markup/text-markup/squiggly-annotation";

import { TextAnnotatorOptions } from "./text-annotator";
import { TextMarkupAnnotator } from "./text-markup-annotator";

export class TextSquigglyAnnotator extends TextMarkupAnnotator {

  constructor(docService: DocumentService, pageService: PageService, 
    parent: HTMLDivElement, options?: TextAnnotatorOptions) {
    super(docService, pageService, parent, options || {});
    this.init();
  }
  
  async saveAnnotationAsync() {
    if (!this._coordsByPageId.size) {
      return;
    }

    const dtos = this.buildAnnotationDtos("/Squiggly");
    for (const dto of dtos) {      
      const annotation = SquigglyAnnotation.createFromDto(dto);
      // DEBUG
      // console.log(annotation);
      this._docService.appendAnnotationToPageAsync(dto.pageId, annotation);
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

          const squigglyLinePoints = buildSquigglyLine(new Vec2(x0, y0), new Vec2(x1, y1), 
            SquigglyAnnotation.squiggleSize);
          if (squigglyLinePoints?.length) {

            let pathTextData = `M ${squigglyLinePoints[0].x},${squigglyLinePoints[0].y} `;
            for (let j = 1; j < squigglyLinePoints.length; j++) {
              pathTextData += `L ${squigglyLinePoints[j].x},${squigglyLinePoints[j].y} `;
            }
  
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", `rgba(${r * 255},${g * 255},${b * 255},${a})`);
            path.setAttribute("stroke-width", this._strokeWidth + "");
            path.setAttribute("stroke-linecap", "square");
            path.setAttribute("d", pathTextData); 
            group.append(path);
          }

        });
      }
    });
  }
}
