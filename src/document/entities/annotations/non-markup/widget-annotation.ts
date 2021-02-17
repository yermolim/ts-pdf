import { annotationTypes } from "../../../const";
import { CryptInfo } from "../../../interfaces";
import { AnnotationDict } from "../annotation-dict";

export class WidgetAnnotation extends AnnotationDict {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.WIDGET);
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
