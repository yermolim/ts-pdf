import { annotationTypes } from "../../annotation-dict";
import { TextMarkupAnnotation } from "./text-markup-annotation";

export class SquigglyAnnotation extends TextMarkupAnnotation {  
  constructor() {
    super(annotationTypes.SQUIGGLY);
  }
}
