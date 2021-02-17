import { annotationTypes } from "../../../const";
import { AnnotationDict } from "../annotation-dict";

export class PrinterMarkAnnotation extends AnnotationDict {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.PRINTER_MARK);
  }
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
