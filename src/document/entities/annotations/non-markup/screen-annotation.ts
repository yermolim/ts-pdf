import { annotationTypes } from "../../../const";
import { AnnotationDict } from "../annotation-dict";

export class ScreenAnnotation extends AnnotationDict {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.SCREEN);
  }
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
