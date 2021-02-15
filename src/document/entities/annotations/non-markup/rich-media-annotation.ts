import { annotationTypes } from "../../../common/const";
import { AnnotationDict } from "../annotation-dict";

export class RichMediaAnnotation extends AnnotationDict {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.RICH_MEDIA);
  }
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
