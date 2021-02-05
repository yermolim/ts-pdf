import { annotationTypes } from "../../../common/const";
import { AnnotationDict } from "../annotation-dict";

export class PopupAnnotation extends AnnotationDict {
  /**
   * (Optional; shall be an indirect reference) The parent annotation 
   * with which this pop-up annotation shall be associated
   */
  Parent: AnnotationDict;
  /**
   * (Optional) A flag specifying whether the pop-up annotation shall initially be displayed open
   */
  Open = false;
  
  constructor() {
    super(annotationTypes.POPUP);
  }
}
