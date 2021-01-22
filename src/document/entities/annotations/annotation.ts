import { ObjRef } from "../core/obj-ref";
import { DictObj, dictObjTypes } from "../core/dict-obj";
import { DateString } from "../common/date-string";
import { BorderStyleDict } from "../core/border-style-dict";
import { AppearanceDict, AppearanceState } from "../core/appearance-dict";
import { OcGroupDict } from "../optional-content/oc-group-dict";
import { OcMembershipDict } from "../optional-content/oc-membership-dict";

/**
 * PDF supports the standard annotation types listed
 */
export const annotationTypes = {
  TEXT: "/Text",
  LINK: "/Link",
  FREE_TEXT: "/FreeText",
  LINE: "/Line",
  SQUARE: "/Square",
  CIRCLE: "/Circle",
  POLYGON: "/Polygon",
  POLYLINE: "/PolyLine",
  HIGHLIGHT: "/Highlight",
  UNDERLINE: "/Underline",
  SQUIGGLY: "/Squiggly",
  STRIKEOUT: "/StrikeOut",
  STAMP: "/Stamp",
  CARET: "/Caret",
  INK: "/Ink",
  POPUP: "/Popup",
  FILE_ATTACHMENT: "/FileAttachment",
  SOUND: "/Sound",
  MOVIE: "/Movie",
  WIDGET: "/Widget",
  SCREEN: "/Screen",
  PRINTER_MARK: "/PrinterMark",
  TRAPNET: "/TrapNet",
  WATERMARK: "/Watermark",
  THREED: "/3D",
  REDACT: "/Redact",
} as const;
export type AnnotationType = typeof annotationTypes[keyof typeof annotationTypes];

/**
 * Flags  specifying  various  characteristics of the annotation
 */
export const annotationFlags = {
  NONE: 0x00,
  /**
   * If set, do not display the annotation 
   * if it does not belong to one of the standard annotation types 
   * and no annotation handler is available. 
   * If clear, display such an unknown annotation using an appearance stream 
   * specified by its appearance dictionary, if any
   */
  INVISIBLE: 0x01,
  /**
   * (PDF 1.2+) If set, do not display or print the annotation 
   * or allow it to interact with the user, regardless of its annotation type 
   * or whether an annotation handler is available
   */
  HIDDEN: 0x02,
  /**
   * (PDF 1.2+) If set, print the annotation 
   * when the page is printed. If clear, never print the annotation, 
   * regardless of whether it is displayed on the screen
   */
  PRINT: 0x04,
  /**
   * (PDF 1.3+) If set, do not scale the annotation’s appearance 
   * to match the magnification of the page
   */
  NO_ZOOM: 0x08,
  /**
   * (PDF 1.3+) If set, do not rotate the annotation’s appearance 
   * to match the rotation of the page
   */
  NO_ROTATE: 0x10,
  /**
   * (PDF 1.3+) If set, do not display the annotation on the screen 
   * or allow it to interact with the user
   */
  NO_VIEW: 0x20,
  /**
   * (PDF 1.3+) If set, do not allow the annotation to interact with the user
   */
  READ_ONLY: 0x40,
  /**
   * (PDF 1.4+) If set, do not allow the annotation to be deleted 
   * or its properties (including position and size) to be modified by the user
   */
  LOCKED: 0x80,
  /**
   * (PDF 1.5+) If set, invert the interpretation of the NoView flag for certain events
   */
  TOGGLE_NO_VIEW: 0x100,
  /**
   * (PDF 1.7+) If set, do not allow the contents of the annotation to be modified by the user. 
   * This flag does not restrict deletion of the annotation or changes to other annotation properties, 
   * such as position and size
   */
  LOCKED_CONTENTS: 0x200,
} as const;


export const annotationStateModelTypes = {
  MARKED: "/Marked",
  REVIEW: "/Review",
} as const;
export type AnnotationStateModelType = typeof annotationStateModelTypes[keyof typeof annotationStateModelTypes];

export const annotationMarkedStates = {
  /**
   * The annotation has been marked by the user
   */
  MARKED: "/Marked",
  /**
   * The annotation has not been marked by the user (the default)
   */
  UNMARKED: "/Unmarked",
} as const;
export type AnnotationMarkedState = typeof annotationMarkedStates[keyof typeof annotationMarkedStates];

export const annotationReviewStates = {
  /**
   * The user agrees with the change
   */
  ACCEPTED: "/Accepted",
  /**
   * The user disagrees  with the change
   */
  REJECTED: "/Rejected",
  /**
   * The change has been cancelled
   */
  CANCELLED: "/Cancelled",
  /**
   * The change has been completed
   */
  COMPLETED: "/Completed",
  /**
   * The user has indicated nothing about the change (the default)
   */
  NONE: "/None",
} as const;
export type AnnotationReviewState = typeof annotationReviewStates[keyof typeof annotationReviewStates];

export class Annotation extends DictObj {
  /** User defined annotation id */
  uuid: string;

  /** (Required) The type of annotation that this dictionary describes */
  Subtype: AnnotationType;
  
  /** (Required) The annotation rectangle, 
   * defining the location of the annotation on the page in default user space units */
  Rect: number[];

  /** (Optional) Text to be displayed for the annotation */
  Contents: string;

  /** (Optional; PDF1.3+) An indirect reference to the page object 
   * with which this annotation is associated */
  P: ObjRef;
  /** (Optional; PDF1.4+) The annotation name,  
   * a text string uniquely identifying it among all the annotations on its page */
  NM: string;
  /** (Optional; PDF1.1+) The date and time when the annotation was most recently modified */
  M: DateString | string;
  /** (Optional; PDF1.1+) A set of flags. 
   * Is an integer interpreted as one-bit flags 
   * specifying various characteristics of the annotation. 
   * Bit positions within the flag word shall be numbered from low-order to high-order, 
   * with the lowest-order bit numbered 1 */
  F = 0;
  
  /** (Optional; PDF1.2+) An appearance dictionary 
   * specifying how the annotation is presented visually on the page */
  AP: AppearanceDict;
  /** (Required if AP contains one or more subdictionaries; PDF1.2+)   
   * The annotation’s appearance state name, 
   * which selects the applicable appearance stream from an appearance subdictionary */
  AS: AppearanceState;
  /** (Optional) An array specifying the characteristics of the annotation’s border.  
   * The border is specified as a rounded rectangle. [rx, ry, w, [dash gap]] */
  Border: (number | number[])[] = [0, 0, 1];
  /** (Optional; PDF1.2+) Specifies a border style dictionary 
   * that has more settings than the array specified for the Border entry. 
   * If an annotation dictionary includes the BS entry, then the Border entry is ignored
   */
  BS: BorderStyleDict;
  /** (Optional; PDF1.5+) Specifies a border effect dictionary 
   * that specifies an effect that shall be applied to the border of the annotations
  */
  BE: BorderStyleDict;
  /** (Optional; PDF1.1+) An array of numbers in the range 0.0 to 1.0, 
   * representing a color of icon background, title bar and link border.
   * The number of array elements determines the color space in which the color is defined: 
   * 0 - transparent; 1 - gray; 3 - RGB; 4 - CMYK */
  C: number[];
  /** (Required if the annotation is a structural content item; PDF 1.3+) 
   * The integer key of the annotation’s entry in the structural parent tree */
  StructParent: number;
  /** (Optional; PDF 1.5+) An optional content group or optional content membership dictionary
   *  specifying the optional content properties for the annotation */
  OC: OcMembershipDict | OcGroupDict;

  constructor() {
    super(dictObjTypes.ANNOTATION);
  }
}
