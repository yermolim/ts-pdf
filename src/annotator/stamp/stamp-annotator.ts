import { getDistance } from "../../common";

import { DocumentData } from "../../document/document-data";
import { StampAnnotation, StampType, stampTypes } 
  from "../../document/entities/annotations/markup/stamp-annotation";
  
import { PageView } from "../../components/pages/page-view";
import { Annotator } from "../annotator";

export const supportedStampTypes = [
  {type:"/Draft", name: "Draft"},
  {type:"/Approved", name: "Approved"},
  {type:"/NotApproved", name: "Not Approved"},
  {type:"/Departmental", name: "Departmental"},
  {type:"/Confidential", name: "Confidential"},
  {type:"/Final", name: "Final"},
  {type:"/Expired", name: "Expired"},
  {type:"/AsIs", name: "As Is"},
  {type:"/Sold", name: "Sold"},
  {type:"/Experimental", name: "Experimental"},
  {type:"/ForComment", name: "For Comment"},
  {type:"/TopSecret", name: "Top Secret"},
  {type:"/ForPublicRelease", name: "For Public"},
  {type:"/NotForPublicRelease", name: "Not For Public"},
] as const;


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
  constructor(docData: DocumentData, parent: HTMLDivElement, pages: PageView[], type?: string) {
    super(docData, parent, pages);
    
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
      this.onPointerMove);
    this._overlay.addEventListener("pointerup", 
      this.onPointerUp);
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

  protected onPointerMove = (e: PointerEvent) => {
    if (!e.isPrimary) {
      // the event source is the non-primary touch. ignore that
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

  protected onPointerUp = (e: PointerEvent) => {
    if (!e.isPrimary || e.button === 2) {
      // the event source is the non-primary touch or the RMB. ignore that
      return;
    }

    const {clientX: cx, clientY: cy} = e;

    if (e.pointerType === "touch") {
      // 700ms - the default Chrome (v.89) delay for detecting a long tap
      const longTap = performance.now() - this._lastPointerDownInfo?.timestamp > 700;
      if (longTap) {
        const downX = this._lastPointerDownInfo?.clientX || 0;
        const downY = this._lastPointerDownInfo?.clientY || 0;
        const displacement = Math.abs(getDistance(cx, cy, downX, downY));
        // 7.5px seems to be the default Chrome (v.89) displacement limit for firing 'contextmenu' event
        const displaced = displacement > 7.5;
        if (!displaced) {
          // long tap without displacement - the context menu condition
          // do not append new annotation 
          return;
        }
      }
    }

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

  protected refreshGroupPosition() {
    // no implementation needed
  }
}
