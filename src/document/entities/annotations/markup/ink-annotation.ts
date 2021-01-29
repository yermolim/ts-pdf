import { annotationTypes } from "../annotation-dict";
import { MarkupAnnotation } from "./markup-annotation";

export class InkAnnotation extends MarkupAnnotation {
  /**
   * (Required) An array of n arrays, each representing a stroked path. 
   * Each array shall be a series of alternating horizontal and vertical coordinates 
   * in default user space, specifying points along the path. 
   * When drawn, the points shall be connected by straight lines or curves 
   * in an implementation-dependent way
   */
  InkList: number[][];
  
  constructor() {
    super(annotationTypes.INK);
  }
}
