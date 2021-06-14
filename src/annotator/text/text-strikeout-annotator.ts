import { Octuple } from "../../common/types";
import { Vec2 } from "mathador";

import { PageService } from "../../services/page-service";
import { DocumentService } from "../../services/document-service";

import { StrikeoutAnnotation } 
  from "../../document/entities/annotations/markup/text-markup/strikeout-annotation";

import { TextAnnotatorOptions } from "./text-annotator";
import { TextMarkupAnnotator } from "./text-markup-annotator";

export class TextStrikeoutAnnotator extends TextMarkupAnnotator {

  constructor(docService: DocumentService, pageService: PageService, 
    parent: HTMLDivElement, options?: TextAnnotatorOptions) {
    super(docService, pageService, parent, options || {});
    this.init();
  }
  
  async saveAnnotationAsync() {
    if (!this._coordsByPageId.size) {
      return;
    }

    const dtos = this.buildAnnotationDtos("/Strikeout");
    for (const dto of dtos) {      
      const annotation = StrikeoutAnnotation.createFromDto(dto);
      // DEBUG
      // console.log(annotation);
      await this._docService.appendAnnotationToPageAsync(dto.pageId, annotation);
    }
    
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
      const bottomLeft = new Vec2();
      const bottomRight = new Vec2();
      const topRight = new Vec2();
      const topLeft = new Vec2();    
      const start = new Vec2();
      const end = new Vec2();

      if (quads?.length) {
        quads.forEach(quad => {
          const [x3, y3, x2, y2, x0, y0, x1, y1] = quad;
          bottomLeft.set(x0, y0);
          bottomRight.set(x1, y1);
          topRight.set(x2, y2);
          topLeft.set(x3, y3);
          start.setFromVec2(bottomLeft).add(topLeft).multiplyByScalar(0.5);
          end.setFromVec2(bottomRight).add(topRight).multiplyByScalar(0.5);

          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("fill", "none");
          path.setAttribute("stroke", `rgba(${r * 255},${g * 255},${b * 255},${a})`);
          path.setAttribute("stroke-width", this._strokeWidth + "");
          path.setAttribute("stroke-linecap", "square");
          path.setAttribute("d", `M ${start.x},${start.y} L ${end.x},${end.y}`); 
          group.append(path);
        });
      }
    });
  }
}
