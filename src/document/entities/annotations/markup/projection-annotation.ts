import { annotationTypes } from "../../../const";
import { DataCryptor } from "../../../crypto";
import { MarkupAnnotation } from "./markup-annotation";

export class ProjectionAnnotation extends MarkupAnnotation {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.PROJECTION);
  }
  
  toArray(cryptor?: DataCryptor): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
