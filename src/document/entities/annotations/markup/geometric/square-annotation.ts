import { annotationTypes } from "../../annotation";
import { GeometricAnnotation } from "./geometric-annotation";

export class SquareAnnotation extends GeometricAnnotation {
  /**
   * (Optional; PDF 1.5+) A set of four numbers that shall describe the numerical differences 
   * between two rectangles: the Rect entry of the annotation and the actual boundaries 
   * of the underlying square or circle. Such a difference may occur in situations 
   * where a border effect (described by BE) causes the size of the Rect to increase 
   * beyond that of the square or circle
   */
  RD: number[];
  
  constructor() {
    super(annotationTypes.SQUARE);
  }
}
