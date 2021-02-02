import { DateString } from "../../../common/date-string";
import { Stream } from "../../core/stream";
import { AnnotationDict, AnnotationType } from "../annotation-dict";
import { ExDataDict } from "../misc/ex-data-dict";
import { PopupAnnotation } from "../non-markup/popup-annotation";

export const markupAnnotationReplyTypes = {
  /**
   * The annotation shall be considered a reply to the annotation specified by IRT. 
   * Conforming readers shall not display replies to an annotation individually 
   * but together in the form of threaded comments
   */
  REPLY: "/R",
  /**
   * The annotation shall be grouped with the annotation specified by IRT
   */
  GROUP: "/Group",
} as const;
export type MarkupAnnotationReplyType = typeof markupAnnotationReplyTypes[keyof typeof markupAnnotationReplyTypes];

export abstract class MarkupAnnotation extends AnnotationDict {
  /**
   * (Optional; PDF 1.1+) The text label that shall be displayed in the title bar 
   * of the annotation’s pop-up window when open and active. 
   * This entry shall identify the user who added the annotation
   */
  T: string;
  /**
   * (Optional; PDF 1.3+) An indirect reference to a pop-up annotation 
   * for entering or editing the text associated with this annotation
   */
  Popup: PopupAnnotation;
  /**
   * (Optional; PDF 1.4+) The constant opacity value
   */
  CA: number;
  /**
   * (Optional; PDF 1.5+) A rich text string that shall be displayed 
   * in the pop-up window when the annotation is opened
   */
  RC: string | Stream;
  /**
   * (Optional; PDF 1.5+) The date and time when the annotation was created
   */
  CreationDate: DateString;
  /**
   * (Optional; PDF 1.5+) Text representing a short description of the subject 
   * being addressed by the annotation
   */
  Subj: string;
  /**
   * (Required if an RT entry is present, otherwise optional; PDF 1.5+) 
   * A reference to the annotation that this annotation is “in reply to.” 
   * Both annotations shall be on the same page of the document. 
   * The relationship between the two annotations shall be specified by the RT entry
   */
  IRT: AnnotationDict;
  /**
   * (Optional; meaningful only if IRT is present; PDF 1.6+) 
   * A name specifying the relationship (the “reply type”) 
   * between this annotation and one specified by IRT
   */
  RT: MarkupAnnotationReplyType = markupAnnotationReplyTypes.REPLY;
  /**
   * (Optional; PDF 1.6+) A name describing the intent of the markup annotation. 
   * Intents allow conforming readers to distinguish between different uses 
   * and behaviors of a single markup annotation type. 
   * If this entry is not present or its value is the same as the annotation type, 
   * the annotation shall have no explicit intent and should behave in a generic manner 
   * in a conforming reader
   */
  IT: string;
  /**
   * (Optional; PDF 1.7+) An external data dictionary specifying data 
   * that shall be associated with the annotation
   */
  ExData: ExDataDict;
  
  protected constructor(subType: AnnotationType) {
    super(subType);
  }
}
