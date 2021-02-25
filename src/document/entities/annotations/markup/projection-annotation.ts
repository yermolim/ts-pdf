import { annotationTypes } from "../../../const";
import { CryptInfo } from "../../../common-interfaces";
import { MarkupAnnotation } from "./markup-annotation";
import { RenderToSvgResult } from "../../../../common";

export class ProjectionAnnotation extends MarkupAnnotation {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.PROJECTION);
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
  
  // TODO: implement render method
}
