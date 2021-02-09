import { annotationTypes } from "../../../../common/const";
import { TextMarkupAnnotation } from "./text-markup-annotation";

export class StrikeoutAnnotation extends TextMarkupAnnotation {  
  constructor() {
    super(annotationTypes.STRIKEOUT);
  }
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
