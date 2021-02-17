import { annotationTypes } from "../../../const";
import { AnnotationDict } from "../annotation-dict";

export class ThreeDAnnotation extends AnnotationDict {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.THREED);
  }
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
