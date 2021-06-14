import { annotationTypes } from "../../../spec-constants";
import { CryptInfo } from "../../../encryption/interfaces";
import { AnnotationDict } from "../annotation-dict";

export class RichMediaAnnotation extends AnnotationDict {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.RICH_MEDIA);
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
  
  // TODO: implement render method
}
