import { Quadruple } from "../../common/types";

import { PageService } from "../../services/page-service";
import { DocumentService } from "../../services/document-service";

import { AnnotatorDataChangeEvent } from "../annotator";
import { TextAnnotator, TextAnnotatorOptions } from "./text-annotator";

export abstract class TextMarkupAnnotator extends TextAnnotator {  
  /**current svg groups by page id */
  protected readonly _svgGroupByPageId = new Map<number, SVGGraphicsElement>();
  
  protected constructor(docService: DocumentService, pageService: PageService, 
    parent: HTMLDivElement, options: TextAnnotatorOptions) {
    super(docService, pageService, parent, options);
  }

  protected clearGroup() {
    this._svgGroupByPageId.forEach(x => x.innerHTML = "");
    this.emitDataChanged(0);
  }

  protected refreshGroupPosition() {
    const {height: vh, top: vtop, left: vx} = this._overlay.getBoundingClientRect();
    const scale = this._pageService.scale;

    this._pageService.renderedPages.forEach(x => {
      const {height: ph, top: ptop, left: px} = x.viewContainer.getBoundingClientRect();
      const py = ptop + ph;
      const vy = vtop + vh;
      const offsetX = (px - vx) / scale;
      const offsetY = (vy - py) / scale;

      let svg: SVGGraphicsElement;
      if (this._svgGroupByPageId.has(x.id)) {
        svg = this._svgGroupByPageId.get(x.id);  
      } else {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this._svgGroupByPageId.set(x.id, svg);
        this._svgGroup.append(svg);
      }      
      svg.setAttribute("transform", `matrix(${[1, 0, 0, 1, offsetX, offsetY].join(" ")})`);
    });
  }
}
