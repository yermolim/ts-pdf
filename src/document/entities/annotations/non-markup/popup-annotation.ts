import { Annotation, annotationTypes } from "../annotation";

export class PopupAnnotation extends Annotation {
  /**
   * (Optional; shall be an indirect reference) The parent annotation 
   * with which this pop-up annotation shall be associated
   */
  Parent: Annotation;
  /**
   * (Optional) A flag specifying whether the pop-up annotation shall initially be displayed open
   */
  Open = false;
  
  constructor() {
    super(annotationTypes.POPUP);
  }
}
