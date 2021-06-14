import { annotationTypes } from "../../../spec-constants";
import { CryptInfo } from "../../../common-interfaces";
import { AnnotationDict } from "../annotation-dict";

export class ThreeDAnnotation extends AnnotationDict {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.THREED);
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
  
  // TODO: implement render method
}
