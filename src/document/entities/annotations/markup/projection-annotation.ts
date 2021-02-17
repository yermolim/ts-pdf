import { annotationTypes } from "../../../const";
import { CryptInfo } from "../../../interfaces";
import { MarkupAnnotation } from "./markup-annotation";

export class ProjectionAnnotation extends MarkupAnnotation {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.PROJECTION);
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
