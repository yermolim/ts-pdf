import { annotationTypes } from "../../../const";
import { CryptInfo } from "../../../common-interfaces";
import { AnnotationDict } from "../annotation-dict";
import { RenderToSvgResult } from "../../../../common";

export class WidgetAnnotation extends AnnotationDict {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.WIDGET);
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
  
  // TODO: implement render method
}
