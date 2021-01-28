import { annotationTypes } from "../../annotation";
import { TextMarkupAnnotation } from "./text-markup-annotation";

export class HighlightAnnotation extends TextMarkupAnnotation {  
  constructor() {
    super(annotationTypes.HIGHLIGHT);
  }
}
