import { annotationTypes } from "../../../const";
import { AnnotationDict } from "../annotation-dict";

export class WatermarkAnnotation extends AnnotationDict {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.WATERMARK);
  }
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
