import { annotationTypes } from "../../../../common/const";
import { TextMarkupAnnotation } from "./text-markup-annotation";

export class UnderlineAnnotation extends TextMarkupAnnotation {  
  constructor() {
    super(annotationTypes.UNDERLINE);
  }
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
