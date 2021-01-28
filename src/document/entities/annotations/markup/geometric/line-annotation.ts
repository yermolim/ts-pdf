import { MeasureDict } from "../../../core/measure-dict";
import { LineEndingType, lineEndingTypes, annotationTypes } from "../../annotation";
import { GeometricAnnotation } from "./geometric-annotation";

export const lineIntents = {
  ARROW: "/LineArrow",
  DIMESION: "/LineDimension",
} as const;
export type LineIntent = typeof lineIntents[keyof typeof lineIntents];

export const captionPositions = {
  INLINE: "/Inline",
  TOP: "/Top",
} as const;
export type CaptionPosition = typeof captionPositions[keyof typeof captionPositions];

export class LineAnnotation extends GeometricAnnotation {
  /**
   * (Required) An array of four numbers, [x1y1x2y2], 
   * specifying the starting and ending coordinates of the line in default user space. 
   * If the LL entry is present, this value shall represent the endpoints 
   * of the leader lines rather than the endpoints of the line itself
   */
  L: number[];
  /**
   * (Optional; PDF 1.4+) An array of two names specifying the line ending styles 
   * that shall be used in drawing the line. The first and second elements 
   * of the array shall specify the line ending styles for the endpoints defined, 
   * respectively, by the first and second pairs of coordinates, 
   * (x1, y1)and (x2, y2), in the L array
   */
  LE: LineEndingType[] = [lineEndingTypes.NONE, lineEndingTypes.NONE];
  /** 
   * (Required if LLE is present, otherwise optional; PDF 1.6+)
   * The length of leader lines in default user space that extend 
   * from each endpoint of the line perpendicular to the line itself, as shown in Figure 60. 
   * A positive value shall mean that the leader lines appear in the direction 
   * that is clockwise when traversing the line from its starting point to its ending point 
   * (as specified by L); a negative value shall indicate the opposite direction
   */
  LL = 0;
  /** 
   * (Optional; PDF 1.6+) A non-negative number that shall represents the length 
   * of leader line extensions that extend from the line proper 180 degrees from the leader lines
   */
  LLE = 0;
  /** 
   * (Optional; PDF 1.6+) If true, the text specified by the Contents or RC entries 
   * shall be replicated as a caption in the appearance of the line
   */
  Cap = false;
  /**
   * (Optional; PDF 1.6+) A name describing the intent of the line annotation
   */
  IT: LineIntent;
  /** 
   * (Optional; PDF 1.7+) A non-negative number that shall represent the length 
   * of the leader line offset, which is the amount of empty space 
   * between the endpoints of the annotation and the beginning of the leader lines
   */
  LLO = 0;
  /** 
   * (Optional; meaningful only if Cap is true; PDF 1.7+) 
   * A name describing the annotation’s caption positioning. Valid values are 
   * Inline, meaning the caption shall be centered inside the line, 
   * and Top, meaning the caption shall be on top of the line
   */
  CP: CaptionPosition = captionPositions.INLINE;
  /** 
   * (Optional; PDF 1.7+) A measure dictionary that shall specify the scale and units 
   * that apply to the line annotation
   */
  Measure: MeasureDict;
  /** 
   * (Optional; meaningful only if Cap is true; PDF 1.7+) 
   * An array of two numbers that shall specify the offset of the caption text 
   * from its normal position. The first value shall be the horizontal offset 
   * along the annotation line from its midpoint, with a positive value 
   * indicating offset to the right and a negative value indicating offset to the left.
   * The second value shall be the vertical offset perpendicular to the annotation line, 
   * with a positive value indicating a shift up and a negative value indicating a shift down
   */
  CO: number[] = [0, 0];
  
  constructor() {
    super(annotationTypes.LINE);
  }
}
