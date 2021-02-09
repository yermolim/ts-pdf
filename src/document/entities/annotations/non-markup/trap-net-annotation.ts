import { annotationTypes } from "../../../common/const";
import { AnnotationDict } from "../annotation-dict";

export class TrapNetAnnotation extends AnnotationDict {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.TRAPNET);
  }
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
