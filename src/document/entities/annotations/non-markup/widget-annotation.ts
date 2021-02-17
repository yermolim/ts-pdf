import { annotationTypes } from "../../../const";
import { AnnotationDict } from "../annotation-dict";

export class WidgetAnnotation extends AnnotationDict {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.WIDGET);
  }
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
