import { annotationTypes } from "../../annotation-dict";
import { TextMarkupAnnotation } from "./text-markup-annotation";

export class HighlightAnnotation extends TextMarkupAnnotation {  
  constructor() {
    super(annotationTypes.HIGHLIGHT);
  }
}
