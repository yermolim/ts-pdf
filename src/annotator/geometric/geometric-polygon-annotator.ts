import { DocumentData } from "../../document/document-data";
import { GeometricAnnotator, GeometricAnnotatorOptions } from "./geometric-annotator";

export class GeometricPolygonAnnotator extends GeometricAnnotator {
  
  constructor(docData: DocumentData, parent: HTMLDivElement, options?: GeometricAnnotatorOptions) {
    super(docData, parent, options || {});
  }
}
