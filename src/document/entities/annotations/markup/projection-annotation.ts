import { annotationTypes } from "../../../common/const";
import { MarkupAnnotation } from "./markup-annotation";

export class ProjectionAnnotation extends MarkupAnnotation {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.PROJECTION);
  }
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
