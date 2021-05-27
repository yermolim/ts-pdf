import { getDistance, Vec2 } from "../../common/math";

import { DocumentService } from "../../services/document-service";
import { PageService } from "../../services/page-service";

import { Viewer } from "../../components/viewer";

import { TextAnnotation } from "../../document/entities/annotations/markup/text-annotation";

import { TextAnnotator, TextAnnotatorOptions } from "./text-annotator";

export class TextNoteAnnotator extends TextAnnotator {
  protected readonly _viewer: Viewer;

  protected _tempAnnotation: TextAnnotation;
  protected _pageId: number;

  protected _addedAnnotations: TextAnnotation[] = [];

  constructor(docService: DocumentService, pageService: PageService, 
    viewer: Viewer, options?: TextAnnotatorOptions) {
    super(docService, pageService, viewer.container, options || {});
    this._viewer = viewer;
    this.init();
  }

  destroy() {    
    this.emitDataChanged(0);
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
    this.emitDataChanged(this._addedAnnotations.length, false, !empty, !empty);
  }

  /**remove all the annotations added by this annotation instance */
  clear() {
    while (this._addedAnnotations.length) {
      this.undo();
    }
  }

  /**saves the current temp annotation to the document data */
  saveAnnotation() {
    if (!this._pageId || !this._tempAnnotation) {
      return;
    }
    
    const initialText = this._tempAnnotation?.Contents?.literal;
    this._viewer.showTextDialogAsync(initialText).then(text => {
      if (text !== null) {
        this._tempAnnotation.setTextContent(text);

        // append the current temp annotation to the page
        this._docService.appendAnnotationToPageAsync(this._pageId, this._tempAnnotation);
    
        this._addedAnnotations.push(this._tempAnnotation);
        this.emitDataChanged(this._addedAnnotations.length, false, true, true);
      }

      // create a new temp annotation
      this.createTempNoteAnnotationAsync();
    });
  }
  
  protected init() {
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
    const [x1, y1, x2, y2] = this._tempAnnotation.Rect;
    this._tempAnnotation.moveTo(new Vec2(pageX + (x2 - x1) / 4, pageY + (y2 - y1) / 4));
    // rotate the current annotation according to the page rotation
    if (pageRotation) {
      this._tempAnnotation.rotateBy(-pageRotation / 180 * Math.PI, new Vec2(pageX, pageY));
    }

    // save the current temp stamp to the document data
    this._pageId = pageId;
    this.saveAnnotation();
  };

  protected refreshGroupPosition() {
    // no implementation needed
  }
}
