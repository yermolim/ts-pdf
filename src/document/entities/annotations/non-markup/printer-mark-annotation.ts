import { annotationTypes } from "../../../const";
import { CryptInfo } from "../../../common-interfaces";
import { AnnotationDict } from "../annotation-dict";

export class PrinterMarkAnnotation extends AnnotationDict {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.PRINTER_MARK);
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
  
  // TODO: implement render method
}
