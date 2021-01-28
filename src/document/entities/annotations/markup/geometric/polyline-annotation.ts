import { annotationTypes, LineEndingType, lineEndingTypes } from "../../annotation";
import { PolyAnnotation } from "./poly-annotation";

export class PolylineAnnotation extends PolyAnnotation {  
  /**
   * (Optional; PDF 1.4+) An array of two names specifying the line ending styles 
   * that shall be used in drawing the line. The first and second elements 
   * of the array shall specify the line ending styles for the endpoints defined, 
   * respectively, by the first and second pairs of coordinates, 
   * (x1, y1)and (x2, y2), in the L array
   */
  LE: LineEndingType[] = [lineEndingTypes.NONE, lineEndingTypes.NONE];

  constructor() {
    super(annotationTypes.POLYLINE);
  }
}
