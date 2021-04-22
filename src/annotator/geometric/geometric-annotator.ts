import { Quadruple } from "../../common";
import { DocumentData } from "../../document/document-data";
import { PageView } from "../../components/pages/page-view";
import { Annotator } from "../annotator";

//#region custom events
export const geometricDataChangeEvent = "tspdf-geometricdatachange" as const;
export interface GeometricDataChangeEventDetail {
  pointCount: number;
}
export class GeometricDataChangeEvent extends CustomEvent<GeometricDataChangeEventDetail> {
  constructor(detail: GeometricDataChangeEventDetail) {
    super(geometricDataChangeEvent, {detail});
  }
}
declare global {
  interface DocumentEventMap {
    [geometricDataChangeEvent]: GeometricDataChangeEvent;
  }
}
//#endregion

export interface GeometricAnnotatorOptions {
  strokeWidth?: number;  
  color?: Quadruple;
  /**enables replacing straight lines with cloud-like curves */
  cloudMode?: boolean;
}

export abstract class GeometricAnnotator extends Annotator {
  protected static lastColor: Quadruple;
  protected static lastStrokeWidth: number;
  protected static lastCloudMode: boolean;
 
  protected _color: Quadruple;
  protected _strokeWidth: number;
  protected _cloudMode: boolean;
  
  /**current page id */
  protected _pageId: number;
  
  protected constructor(docData: DocumentData, parent: HTMLDivElement, pages: PageView[], options: GeometricAnnotatorOptions) {
    super(docData, parent, pages);
    
    this._color = options?.color || GeometricAnnotator.lastColor || [0, 0, 0, 0.9];
    GeometricAnnotator.lastColor = this._color;

    this._strokeWidth = options?.strokeWidth || GeometricAnnotator.lastStrokeWidth || 3;
    GeometricAnnotator.lastStrokeWidth = this._strokeWidth;
    
    this._cloudMode = options?.cloudMode || GeometricAnnotator.lastCloudMode || false;
    GeometricAnnotator.lastCloudMode = this._cloudMode;
  }
  
  destroy() {
    super.destroy();
  }

  protected init() {
    super.init();
  }
  
  protected emitPointCount(count = 0) {
    document.dispatchEvent(new GeometricDataChangeEvent({
      pointCount: count,
    }));
  }

  protected clearGroup() {
    this._svgGroup.innerHTML = "";
    this.emitPointCount(0);
  }
    
  protected refreshGroupPosition() {
    if (!this._pageId && this._pageId !== 0) {
      // page for drawing not selected
      return;
    }    

    const page = this._pages.find(x => x.id === this._pageId);
    if (!page) {
      // set scale to 0 to hide the svg group if it's page is not rendered
      this._svgGroup.setAttribute("transform", `matrix(${[0, 0, 0, 0, 0, 0].join(" ")})`);
      return;
    }

    const {height: ph, top: ptop, left: px} = page.viewContainer.getBoundingClientRect();
    const py = ptop + ph;
    const {height: vh, top: vtop, left: vx} = this._overlay.getBoundingClientRect();
    const vy = vtop + vh;
    const offsetX = (px - vx) / this._scale;
    const offsetY = (vy - py) / this._scale;
    this._svgGroup.setAttribute("transform", `matrix(${[1, 0, 0, 1, offsetX, offsetY].join(" ")})`);
  }
  
  abstract undo(): void;
  
  abstract clear(): void;
  
  abstract saveAnnotation(): void;
}
