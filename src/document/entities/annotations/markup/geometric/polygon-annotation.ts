import { annotationTypes } from "../../../../common/const";
import { PolyAnnotation } from "./poly-annotation";

export class PolygonAnnotation extends PolyAnnotation {  
  constructor() {
    super(annotationTypes.POLYGON);
  }
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
