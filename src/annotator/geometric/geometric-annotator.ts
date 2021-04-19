import { Quadruple } from "../../common";
import { DocumentData } from "../../document/document-data";
import { Annotator } from "../annotator";

export interface GeometricAnnotatorOptions {
  strokeWidth?: number;  
  color?: Quadruple;
  /**enables replacing straight lines with cloud-like curves */
  cloudMode?: boolean;
}

export abstract class GeometricAnnotator extends Annotator {
  
  protected constructor(docData: DocumentData, parent: HTMLDivElement, options: GeometricAnnotatorOptions) {
    super(docData, parent);
  }
}
