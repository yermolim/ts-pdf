import { getDistance2D, Vec2 } from "mathador";

import { DocumentService } from "../../services/document-service";
import { PageService } from "../../services/page-service";

import { Viewer } from "../../components/viewer";

import { TextAnnotation } from "../../document/entities/annotations/markup/text-annotation";

import { TextAnnotator, TextAnnotatorOptions } from "./text-annotator";

export class TextNoteAnnotator extends TextAnnotator {
  protected readonly _viewer: Viewer;

  protected _pageId: number;
  protected _tempAnnotation: TextAnnotation;

  constructor(docService: DocumentService, pageService: PageService, 
    viewer: Viewer, options?: TextAnnotatorOptions) {
    super(docService, pageService, viewer.container, options || {});
    this._viewer = viewer;
    this.init();
  }

  override destroy() {    
    this._tempAnnotation = null;
    super.destroy();
  }

  undo() {
    this.clear();
  }

  clear() {
    this._tempAnnotation = null;
  }

  /**saves the current temp annotation to the document data */
  async saveAnnotationAsync() {
    if (!this._pageId || !this._tempAnnotation) {
      return;
    }
    
    const initialText = this._tempAnnotation?.Contents?.literal;

    const text = await this._viewer.showTextDialogAsync(initialText);
    if (text !== null) {
      this._tempAnnotation.setTextContent(text);

      // append the current temp annotation to the page
      this._docService.appendAnnotationToPageAsync(this._pageId, this._tempAnnotation);
    }

    // create a new temp annotation
    this.createTempNoteAnnotationAsync();
  }
  
  protected override init() {
    super.init();

    this._overlay.addEventListener("pointermove", 
      this.onPointerMove);
    this._overlay.addEventListener("pointerup", 
      this.onPointerUp);
    this.createTempNoteAnnotationAsync();
  }
  
  /**
   * create temporary stamp annotation to render in under the pointer
   */
  protected async createTempNoteAnnotationAsync() {
    const note = TextAnnotation.createStandard(this._docService.userName, this._color);
    const renderResult = await note.renderApStreamAsync();  

    this._svgGroup.innerHTML = "";
    this._svgGroup.append(...renderResult.clipPaths);
    this._svgGroup.append(...renderResult.elements.map(x => x.element));

    this._tempAnnotation = note;
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
    const [x1, y1, x2, y2] = this._tempAnnotation.Rect;
    this._svgGroup.setAttribute("transform",
      `translate(${offsetX - (x2 - x1) / 4} ${offsetY - (y2 - y1) / 4})`);

    // get coords under the pointer relatively to the page under it 
    this.updatePointerCoords(cx, cy);
  };

  protected onPointerUp = async (e: PointerEvent) => {
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
        const displacement = Math.abs(getDistance2D(cx, cy, downX, downY));
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
    const [x1, y1, x2, y2] = this._tempAnnotation.Rect;
    await this._tempAnnotation.moveToAsync(new Vec2(pageX + (x2 - x1) / 4, pageY + (y2 - y1) / 4));
    // rotate the current annotation according to the page rotation
    if (pageRotation) {
      await this._tempAnnotation.rotateByAsync(-pageRotation / 180 * Math.PI, new Vec2(pageX, pageY));
    }

    // save the current temp stamp to the document data
    this._pageId = pageId;
    await this.saveAnnotationAsync();
  };

  protected refreshGroupPosition() {
    // no implementation needed
  }
}
