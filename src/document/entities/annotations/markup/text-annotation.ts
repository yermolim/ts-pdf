import { annotationTypes, AnnotationIconType, 
  AnnotationMarkedState, AnnotationReviewState, AnnotationStateModelType } from "../annotation";
import { MarkupAnnotation } from "./markup-annotation";
export class TextAnnotation extends MarkupAnnotation {
  /**
   * (Optional) A flag specifying whether the annotation shall initially be displayed open
   */
  Open = false;
  /**
   * (Optional) The name of an icon that shall be used in displaying the annotation
   */
  Name: AnnotationIconType;
  /**
   * (Optional; PDF 1.5+) The state to which the original annotation shall be set
   */
  State: AnnotationMarkedState | AnnotationReviewState;
  /**
   * (Required if State is present, otherwise optional; PDF 1.5+) 
   * The state model corresponding to State
   */
  StateModel: AnnotationStateModelType;
  
  constructor() {
    super(annotationTypes.TEXT);
  }
}
