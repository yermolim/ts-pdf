import { DocumentData } from "../document/document-data";
import { StampAnnotation, StampType, stampTypes } 
  from "../document/entities/annotations/markup/stamp-annotation";

import { Annotator } from "./annotator";

/**tool for adding rubber stamp annotations */
export class StampAnnotator extends Annotator {
  protected static lastType: StampType = "/Draft";

  protected _type: StampType;
  protected _tempAnnotation: StampAnnotation;

  /**
   * 
   * @param docData 
   * @param parent 
   * @param type stamp type
   */
  constructor(docData: DocumentData, parent: HTMLDivElement, type?: string) {
    super(docData, parent);
    
    if (type) {
      if (!(<string[]>Object.values(stampTypes)).includes(type)) {
        throw new Error(`Unsupported stamp type: '${type}'`);
      }
      this._type = <StampType>type;
      StampAnnotator.lastType = this._type;
    } else {
      this._type = StampAnnotator.lastType;
    }

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

  /**
   * create temporary stamp annotation to render in under the pointer
   */
  protected async createTempStampAnnotationAsync() {
    const stamp = StampAnnotation.createStandard(this._type, this._docData.userName);
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

    // move temp stamp under the current pointer position
    const [x1, y1, x2, y2] = this._tempAnnotation.Rect;
    this._svgGroup.setAttribute("transform",
      `translate(${offsetX - (x2 - x1) / 2} ${offsetY - (y2 - y1) / 2})`);

    // get coords under the pointer relatively to the page under it 
    this.updatePointerCoords(cx, cy);
  };

  protected onStampPointerUp = (e: PointerEvent) => {
    if (!e.isPrimary || e.button === 2) {
      return;
    }    

    const {clientX: cx, clientY: cy} = e;
    const pageCoords = this.getPageCoordsUnderPointer(cx, cy);
    this._pointerCoordsInPageCS = pageCoords;

    if (!pageCoords || !this._tempAnnotation) {
      return;
    }

    // translate the stamp to the pointer position
    const {pageId, pageX, pageY} = this._pointerCoordsInPageCS;
    this._tempAnnotation.moveTo(pageX, pageY);
    // append the current temp stamp to the page
    this._docData.appendAnnotationToPage(pageId, this._tempAnnotation);

    // create new temp annotation
    this.createTempStampAnnotationAsync();
  };
}
