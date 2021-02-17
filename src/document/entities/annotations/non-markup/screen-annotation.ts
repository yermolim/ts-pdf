import { annotationTypes } from "../../../const";
import { DataCryptor } from "../../../crypto";
import { AnnotationDict } from "../annotation-dict";

export class ScreenAnnotation extends AnnotationDict {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.SCREEN);
  }
  
  toArray(cryptor?: DataCryptor): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
