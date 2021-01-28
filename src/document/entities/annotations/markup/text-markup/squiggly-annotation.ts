import { annotationTypes } from "../../annotation";
import { TextMarkupAnnotation } from "./text-markup-annotation";

export class SquigglyAnnotation extends TextMarkupAnnotation {  
  constructor() {
    super(annotationTypes.SQUIGGLY);
  }
}
