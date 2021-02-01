import { MeasureDict } from "../../../misc/measure-dict";
import { AnnotationType } from "../../annotation-dict";
import { GeometricAnnotation } from "./geometric-annotation";

export const polyIntents = {
  CLOUD: "/PolygonCloud",
  POLYGON_DIMESION: "/PolygonDimension",
  POLYLINE_DIMESION: "/PolyLineDimension",
} as const;
export type PolyIntent = typeof polyIntents[keyof typeof polyIntents];


export abstract class PolyAnnotation extends GeometricAnnotation {
  /**
   * (Required) An array of numbers specifying the width and dash pattern 
   * that shall represent the alternating horizontal and vertical coordinates, 
   * respectively, of each vertex, in default user space
   */
  Vertices: number[];
  /**
   * (Optional; PDF 1.6+) A name describing the intent of the poly annotation
   */
  IT: PolyIntent;
  /** 
   * (Optional; PDF 1.7+) A measure dictionary that shall specify the scale and units 
   * that apply to the line annotation
   */
  Measure: MeasureDict;
  
  protected constructor(type: AnnotationType) {
    super(type);
  }
}
