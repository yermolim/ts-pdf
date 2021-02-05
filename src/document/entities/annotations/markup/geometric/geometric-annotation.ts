import { AnnotationType } from "../../../../common/const";
import { MarkupAnnotation } from "../markup-annotation";

export abstract class GeometricAnnotation extends MarkupAnnotation {
  /** 
   * (Optional; PDF 1.4+) An array of numbers in the range 0.0 to 1.0 
   * specifying the interior color that shall be used to fill the annotation’s line endings
   */
  IC: number[];
  
  protected constructor(type: AnnotationType) {
    super(type);
  }
}
