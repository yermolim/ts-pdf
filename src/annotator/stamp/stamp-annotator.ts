import { getDistance, Vec2 } from "../../common/math";
import { getRandomUuid } from "../../common/uuid";
import { CustomStampCreationInfo, standardStampCreationInfos } from "../../drawing/stamps";

import { PageService } from "../../services/page-service";
import { DocumentService } from "../../services/document-service";
import { StampAnnotation, StampAnnotationDto } 
  from "../../document/entities/annotations/markup/stamp-annotation";
  
import { Annotator, AnnotatorDataChangeEvent } from "../annotator";

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
  protected _type: string;
  protected _creationInfo: CustomStampCreationInfo;

  protected _tempAnnotation: StampAnnotation;
  protected _pageId: number;

  protected _addedAnnotations: StampAnnotation[] = [];

  /**
   * 
   * @param docService 
   * @param parent 
   * @param type stamp type
   */
  constructor(docService: DocumentService, pageService: PageService, 
    parent: HTMLDivElement, type: string, creationInfo?: CustomStampCreationInfo) {
    super(docService, pageService, parent);
    
    if (!type) {
      throw new Error("Stamp type is not defined");
    }
    this._type = type;
    this._creationInfo = creationInfo;

    this.init();
  }

  destroy() {    
    this.emitDataChanged(0, false, false);
    this._tempAnnotation = null;
    super.destroy();
  }

  /**remove the most recently added annotation by this annotation instance */
  undo() {
    if (!this._addedAnnotations.length) {
      return;
    }

    const lastAnnotation = this._addedAnnotations.pop();
    this._docService.removeAnnotation(lastAnnotation);
    const empty = !this._addedAnnotations.length;
    this.emitDataChanged(this._addedAnnotations.length, !empty, !empty);
  }

  /**remove all the annotations added by this annotation instance */
  clear() {
    while (this._addedAnnotations.length) {
      this.undo();
    }
  }

  /**saves the current temp annotation to the document data */
  async saveAnnotationAsync() {
    if (!this._pageId || !this._tempAnnotation) {
      return;
    }

    // append the current temp annotation to the page
    this._docService.appendAnnotationToPageAsync(this._pageId, this._tempAnnotation);

    this._addedAnnotations.push(this._tempAnnotation);
    this.emitDataChanged(this._addedAnnotations.length, true, true);

    // create a new temp annotation
    this.createTempStampAnnotationAsync();
  }
  
  protected init() {
    super.init();

    this._overlay.addEventListener("pointermove", 
      this.onPointerMove);
    this._overlay.addEventListener("pointerup", 
      this.onPointerUp);
    this.createTempStampAnnotationAsync();
  }
  
  protected emitDataChanged(count: number, clearable?: boolean, undoable?: boolean) {
    this._docService.eventService.dispatchEvent(new AnnotatorDataChangeEvent({
      annotatorType: "stamp",
      elementCount: count,
      undoable,
      clearable,
      saveable: false,
    }));
  }  

  protected createStandardStamp(type: string, 
    userName?: string): StampAnnotation {
    const nowString = new Date().toISOString();
    const dto: StampAnnotationDto = {
      uuid: getRandomUuid(),
      annotationType: "/Stamp",
      pageId: null,

      dateCreated: nowString,
      dateModified: nowString,
      author: userName || "unknown",

      textContent: null,

      rect: null,
      matrix: null,

      stampType: type,
      stampSubject: null,
      stampImageData: null,
    };

    return StampAnnotation.createFromDto(dto);
  }

  protected createCustomStamp(creationInfo: CustomStampCreationInfo,
    userName?: string): StampAnnotation {
    const nowString = new Date().toISOString();
    const dto: StampAnnotationDto = {
      uuid: getRandomUuid(),
      annotationType: "/Stamp",
      pageId: null,

      dateCreated: nowString,
      dateModified: nowString,
      author: userName || "unknown",

      textContent: null,

      rect: creationInfo.rect,
      bbox: creationInfo.bBox,
      matrix: null,

      stampType: creationInfo.type,
      stampSubject: creationInfo.subject,
      stampImageData: [...creationInfo.imageData],
    };

    return StampAnnotation.createFromDto(dto);
  }
  
  /**
   * create temporary stamp annotation to render in under the pointer
   */
  protected async createTempStampAnnotationAsync() {
    let stamp: StampAnnotation;
    if (standardStampCreationInfos[this._type]) {
      // stamp is standard
      stamp = this.createStandardStamp(this._type, this._docService.userName);
    } else if (this._creationInfo) {
      // stamp is custom
      stamp = this.createCustomStamp(this._creationInfo, this._docService.userName);
    } else {
      throw new Error(`Unsupported stamp type: ${this._type}`);
    }

    // render the newly created stamp
    const renderResult = await stamp.renderApStreamAsync();  

    // append the render result to the annotator SVG
    this._svgGroup.innerHTML = "";
    this._svgGroup.append(...renderResult.clipPaths);
    this._svgGroup.append(...renderResult.elements.map(x => x.element));

    // set the stamp to the corresponding property
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

    const offsetX = (cx - ox) / this._pageService.scale;
    const offsetY = (oy - cy) / this._pageService.scale;

    // move temp stamp under the current pointer position
    if (this._tempAnnotation) {
      const [x1, y1, x2, y2] = this._tempAnnotation.Rect;
      this._svgGroup.setAttribute("transform",
        `translate(${offsetX - (x2 - x1) / 2} ${offsetY - (y2 - y1) / 2})`);
    }

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

    const pageCoords = this._pageService.getPageCoordsUnderPointer(cx, cy);
    this._pointerCoordsInPageCS = pageCoords;

    if (!pageCoords || !this._tempAnnotation) {
      return;
    }

    const {pageId, pageX, pageY, pageRotation} = this._pointerCoordsInPageCS;

    // translate the stamp to the pointer position
    this._tempAnnotation.moveTo(new Vec2(pageX, pageY));
    // rotate the current annotation according to the page rotation
    if (pageRotation) {      
      this._tempAnnotation.rotateBy(-pageRotation / 180 * Math.PI);
    }

    // save the current temp stamp to the document data
    this._pageId = pageId;
    this.saveAnnotationAsync();
  };

  protected refreshGroupPosition() {
    // no implementation needed
  }
}
