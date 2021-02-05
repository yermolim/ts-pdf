import { annotationTypes } from "../../../../common/const";
import { TextMarkupAnnotation } from "./text-markup-annotation";

export class StrikeoutAnnotation extends TextMarkupAnnotation {  
  constructor() {
    super(annotationTypes.STRIKEOUT);
  }
}
