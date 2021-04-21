import { Quadruple } from "../../common";
import { DocumentData } from "../../document/document-data";
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
  
  protected constructor(docData: DocumentData, parent: HTMLDivElement, options: GeometricAnnotatorOptions) {
    super(docData, parent);
    
    this._color = options?.color || GeometricAnnotator.lastColor || [0, 0, 0, 0.9];
    GeometricAnnotator.lastColor = this._color;

    this._strokeWidth = options?.strokeWidth || GeometricAnnotator.lastStrokeWidth || 3;
    GeometricAnnotator.lastStrokeWidth = this._strokeWidth;
    
    this._cloudMode = options?.cloudMode || GeometricAnnotator.lastCloudMode || false;
    GeometricAnnotator.lastCloudMode = this._cloudMode;
  } 
  
  undo() {

  }
  
  clear() {
    
  }
  
  saveAnnotation() {
    
  }

  protected init() {
    super.init();
  }
}
