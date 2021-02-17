import { annotationTypes } from "../../../const";
import { DataCryptor } from "../../../crypto";
import { AnnotationDict } from "../annotation-dict";

export class RichMediaAnnotation extends AnnotationDict {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.RICH_MEDIA);
  }
  
  toArray(cryptor?: DataCryptor): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
