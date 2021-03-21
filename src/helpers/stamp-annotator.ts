import { DocumentData } from "../document/document-data";
import { StampAnnotation } from "../document/entities/annotations/markup/stamp-annotation";

import { Annotator } from "./annotator";

export class StampAnnotator extends Annotator {
  protected _tempAnnotation: StampAnnotation;

  constructor(docData: DocumentData, parent: HTMLDivElement) {
    super(docData, parent);
    this.init();
  }

  destroy() {    
    this._tempAnnotation = null;
    super.destroy();
  }
  
  protected init() {
    super.init();

    this._overlay.addEventListener("pointermove", 
      this.onStampPointerMove);
    this._overlay.addEventListener("pointerup", 
      this.onStampPointerUp);
    this.createTempStampAnnotationAsync();
  }

  protected async createTempStampAnnotationAsync() {
    const stamp = this._docData.createStampAnnotation("draft");
    const renderResult = await stamp.renderAsync();  

    this._svgGroup.innerHTML = "";  
    this._svgGroup.append(...renderResult.clipPaths || []);
    this._svgGroup.append(renderResult.svg);

    this._tempAnnotation = stamp;
  }

  protected onStampPointerMove = (e: PointerEvent) => {
    if (!e.isPrimary) {
      return;
    }

    const {clientX: cx, clientY: cy} = e;

    // bottom-left overlay coords
    const {height: oh, top, left: ox} = this._parent.getBoundingClientRect();
    const oy = top + oh;

    const offsetX = (cx - ox) / this._scale;
    const offsetY = (oy - cy) / this._scale;

    const [x1, y1, x2, y2] = this._tempAnnotation.Rect;
    this._svgGroup.setAttribute("transform",
      `translate(${offsetX - (x2 - x1) / 2} ${offsetY - (y2 - y1) / 2})`);

    // get coords under the pointer relatively to the page under it 
    this.updatePageCoords(cx, cy);
  };

  protected onStampPointerUp = (e: PointerEvent) => {
    if (!e.isPrimary) {
      return;
    }

    const {clientX: cx, clientY: cy} = e;
    const pageCoords = this.getPageCoordsUnderPointer(cx, cy);
    this._pageCoords = pageCoords;

    if (!pageCoords || !this._tempAnnotation) {
      return;
    }

    // translate the stamp to the pointer position
    const {pageId, pageX, pageY} = this._pageCoords;
    this._tempAnnotation.moveTo(pageX, pageY);
    this._docData.appendAnnotationToPage(pageId, this._tempAnnotation);

    // rerender the page
    this.forceRenderPageById(pageId);

    // create new temp annotation
    this.createTempStampAnnotationAsync();
  };
}
