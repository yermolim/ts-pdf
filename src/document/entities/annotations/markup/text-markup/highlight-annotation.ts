import { annotationTypes } from "../../../../common/const";
import { TextMarkupAnnotation } from "./text-markup-annotation";

export class HighlightAnnotation extends TextMarkupAnnotation {  
  constructor() {
    super(annotationTypes.HIGHLIGHT);
  }
}
