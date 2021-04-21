import { DocumentData } from "../../document/document-data";
import { GeometricAnnotator, GeometricAnnotatorOptions } from "./geometric-annotator";

export class GeometricCircleAnnotator extends GeometricAnnotator {
  
  constructor(docData: DocumentData, parent: HTMLDivElement, options?: GeometricAnnotatorOptions) {
    super(docData, parent, options || {});
    this.init();
  }
  
  protected init() {
    super.init();
  }
}
