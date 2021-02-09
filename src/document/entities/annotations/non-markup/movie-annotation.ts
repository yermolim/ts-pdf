import { annotationTypes } from "../../../common/const";
import { AnnotationDict } from "../annotation-dict";

export class MovieAnnotation extends AnnotationDict {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.MOVIE);
  }
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
