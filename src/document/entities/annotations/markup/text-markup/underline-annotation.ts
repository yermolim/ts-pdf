import { annotationTypes } from "../../annotation";
import { TextMarkupAnnotation } from "./text-markup-annotation";

export class UnderlineAnnotation extends TextMarkupAnnotation {  
  constructor() {
    super(annotationTypes.UNDERLINE);
  }
}
