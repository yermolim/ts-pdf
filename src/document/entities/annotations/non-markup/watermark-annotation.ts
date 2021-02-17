import { annotationTypes } from "../../../const";
import { DataCryptor } from "../../../crypto";
import { AnnotationDict } from "../annotation-dict";

export class WatermarkAnnotation extends AnnotationDict {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.WATERMARK);
  }
  
  toArray(cryptor?: DataCryptor): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
