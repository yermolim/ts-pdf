import { AnnotationType } from "../../annotation";
import { MarkupAnnotation } from "../markup-annotation";

export abstract class TextMarkupAnnotation extends MarkupAnnotation {
  /** 
   * (Required) An array of 8×n numbers specifying the coordinates of n quadrilaterals 
   * in default user space. Each quadrilateral shall encompasses a word 
   * or group of contiguous words in the text underlying the annotation
   */
  QuadPoints: number[];
  
  protected constructor(type: AnnotationType) {
    super(type);
  }
}
