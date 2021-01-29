import { annotationTypes } from "../../annotation-dict";
import { PolyAnnotation } from "./poly-annotation";

export class PolygonAnnotation extends PolyAnnotation {  
  constructor() {
    super(annotationTypes.POLYGON);
  }
}
