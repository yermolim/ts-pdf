import { annotationTypes } from "../../../common/const";
import { MarkupAnnotation } from "./markup-annotation";

export const caretSymbolTypes = {
  NONE: "/None",
  PARAGRAPH: "/P",
} as const;
export type CaretSymbolType = typeof caretSymbolTypes[keyof typeof caretSymbolTypes];


export class CaretAnnotation extends MarkupAnnotation {
  /**
   * (Optional; PDF 1.5+) A set of four numbers that shall describe the numerical differences 
   * between two rectangles: the Rect entry of the annotation and the actual boundaries 
   * of the underlying caret. Such a difference can occur. When a paragraph symbol 
   * specified by Sy is displayed along with the caret
   */
  RD: number[];
  /**
   * (Optional) A name specifying a symbol that shall be associated with the caret
   */
  Sy: CaretSymbolType = caretSymbolTypes.NONE;
  
  constructor() {
    super(annotationTypes.CARET);
  }
}
