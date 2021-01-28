import { annotationTypes } from "../../annotation";
import { TextMarkupAnnotation } from "./text-markup-annotation";

export class StrikeoutAnnotation extends TextMarkupAnnotation {  
  constructor() {
    super(annotationTypes.STRIKEOUT);
  }
}
