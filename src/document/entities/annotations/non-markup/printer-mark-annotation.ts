import { annotationTypes } from "../../../const";
import { DataCryptor } from "../../../crypto";
import { AnnotationDict } from "../annotation-dict";

export class PrinterMarkAnnotation extends AnnotationDict {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.PRINTER_MARK);
  }
  
  toArray(cryptor?: DataCryptor): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
