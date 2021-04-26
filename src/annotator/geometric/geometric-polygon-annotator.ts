import { DocumentData } from "../../document/document-data";

import { PageView } from "../../components/pages/page-view";
import { GeometricAnnotator, GeometricAnnotatorOptions } from "./geometric-annotator";

export class GeometricPolygonAnnotator extends GeometricAnnotator {
  
  constructor(docData: DocumentData, parent: HTMLDivElement, 
    pages: PageView[], options?: GeometricAnnotatorOptions) {
    super(docData, parent, pages, options || {});

    this.init();
  }

  destroy() {
    super.destroy();    
    this.emitPointCount(0);
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
