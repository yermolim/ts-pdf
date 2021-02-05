import { annotationTypes, JustificationType, LineEndingType, lineEndingTypes } from "../../../common/const";
import { AppearanceString } from "../../appearance/appearance-string";
import { PdfStream } from "../../core/pdf-stream";
import { MarkupAnnotation } from "./markup-annotation";

export const freeTextIntents = {
  PLAIN_TEXT: "/FreeText",
  WITH_CALLOUT: "/FreeTextCallout",
  CLICK_TO_TYPE: "/FreeTextTypeWriter",
} as const;
export type FreeTextIntent = typeof freeTextIntents[keyof typeof freeTextIntents];

export class FreeTextAnnotation extends MarkupAnnotation {
  /**
   * (Required) The default appearance string that shall be used in formatting the text. 
   * The annotation dictionary’s AP entry, if present, shall take precedence over the DA entry
   */
  DA: AppearanceString;
  /**
   * (Optional; PDF 1.4+) A code specifying the form of quadding (justification) 
   * that shall be used in displaying the annotation’s text
   */
  Q: JustificationType;
  /**
   * (Optional; PDF 1.5+) A rich text string that shall be used 
   * to generate the appearance of the annotation
   */
  RC: string | PdfStream;
  /**
   * (Optional; PDF 1.5+) A default style
   */
  DS: string;
  /**
   * (Optional; meaningful only if IT is FreeTextCallout; PDF 1.6+) 
   * An array of four or six numbers specifying a callout line 
   * attached to the free text annotation. Six numbers [x1y1x2y2x3y3] 
   * represent the starting, knee point, and ending coordinates of the line in default user space. 
   * Four numbers [x1y1x2y2] represent the starting and ending coordinates of the line
   */
  CL: number[];
  /**
   * (Optional; PDF 1.6+) A name describing the intent of the free text annotation
   */
  IT: FreeTextIntent = freeTextIntents.PLAIN_TEXT;
  /**
   * (Optional; PDF 1.6+) A set of four numbers describing the numerical differences 
   * between two rectangles: the Rect entry of the annotation and a rectangle contained 
   * within that rectangle. The inner rectangle is where the annotation’s text should be displayed. 
   * Any border styles and/or border effects specified by BS and BE entries, respectively, 
   * shall be applied to the border of the inner rectangle
   */
  RD: number[];
  /**
   * (Optional; meaningful only if CL is present; PDF 1.6+) 
   * A name specifying the line ending style that shall be used in drawing the callout line 
   * specified in CL. The name shall specify the line ending style for the endpoint 
   * defined by the pairs of coordinates (x1, y1)
   */
  LE: LineEndingType = lineEndingTypes.NONE;
  
  constructor() {
    super(annotationTypes.FREE_TEXT);
  }
}
