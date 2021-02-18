import { annotationTypes } from "../../../const";
import { CryptInfo } from "../../../common-interfaces";
import { AnnotationDict } from "../annotation-dict";

export class RichMediaAnnotation extends AnnotationDict {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.RICH_MEDIA);
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
