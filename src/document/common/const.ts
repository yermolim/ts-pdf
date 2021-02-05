/**
 * PDF supports eight basic types of objects
 */
export const objectTypes = {
  UNKNOWN: 0,
  NULL: 1,
  BOOLEAN: 2,
  NUMBER: 3,
  STRING_LITERAL: 4,
  STRING_HEX: 5,
  NAME: 6,
  ARRAY: 7,
  DICTIONARY: 8,
  STREAM: 9,
} as const;
export type ObjectType = typeof objectTypes[keyof typeof objectTypes]; 

/**
 * Cross-reference tables are used in PDF pre-1.5,
 * cross-reference streams are used in PDF 1.5+,
 * hybrid cross-reference sections are used to support opening PDF 1.5+ in pre-1.4 readers.
 */
export const xRefTypes = {
  TABLE: 0,
  STREAM: 1,
  HYBRID: 2,
} as const;
export type XRefType = typeof xRefTypes[keyof typeof xRefTypes]; 

export const xRefEntryTypes = {
  FREE: 0,
  NORMAL: 1,
  COMPRESSED: 2,
} as const;
export type XRefEntryType = typeof xRefEntryTypes[keyof typeof xRefEntryTypes]; 

/**
 * Each entry in a cross-reference stream has one or more fields, 
 * the first of which designates the entry’s type. 
 * In PDF 1.5, only types 0, 1, and 2 are allowed.  
 * Any other value is interpreted as a reference to the null object, 
 * thus permitting new entry types to be defined in the future.
 */
export const crsEntryTypes = {
  FREED: 0,
  NORMAL: 1,
  COMPRESSED: 2,
} as const;

export const streamFilters = {
  ASCII85: "/ASCII85Decode",
  ASCIIHEX: "/ASCIIHexDecode",
  CCF: "/CCITTFaxDecode",
  CRYPT: "/Crypt",
  DCT: "/DCTDecode",
  FLATE: "/FlateDecode",
  JBIG2: "/JBIG2Decode",
  JPX: "/JPXDecode",
  LZW: "/LZWDecode",
  RLX: "/RunLengthDecode",
} as const;
export type StreamFilter = typeof streamFilters[keyof typeof streamFilters]; 

export const flatePredictors = {
  NONE: 1,
  TIFF: 2,
  PNG_NONE: 10,
  PNG_SUB: 11,
  PNG_UP: 12,
  PNG_AVERAGE: 13,
  PNG_PAETH: 14,
  PNG_OPTIMUM: 15,
} as const;
export type FlatePredictor = typeof flatePredictors[keyof typeof flatePredictors]; 

export const onOffStates = {
  ON: "/ON",
  OFF: "/OFF",
} as const;
export type OnOffState = typeof onOffStates[keyof typeof onOffStates];

export const justificationTypes = {
  LEFT: 0,
  CENTER: 1,
  RIGHT: 2,
} as const;
export type JustificationType = typeof justificationTypes[keyof typeof justificationTypes];

export const pageLayouts = {
  SINGLE: "/SinglePage",
  TWO_ODD_LEFT: "/TwoPageLeft",
  TWO_ODD_RIGHT: "/TwoPageRight",
  SINGLE_COLUMN: "/OneColumn",
  TWO_COLUMNS_ODD_LEFT: "/TwoColumnLeft",
  TWO_COLUMNS_ODD_RIGHT: "/TwoColumnRight",
} as const;
export type PageLayout = typeof pageLayouts[keyof typeof pageLayouts];

export const pageModes = {
  NONE: "/UseNone",
  OUTLINES: "/UseOutlines",
  THUMBS: "/UseThumbs",
  FULL_SCREEN: "/FullScreen",
  OPTIONAL_CONTENT: "/UseOC",
  ATTACHMENTS: "/UseAttachments",
} as const;
export type PageMode = typeof pageModes[keyof typeof pageModes];

export const streamTypes = {
  FORM_XOBJECT: "/XObject",
  XREF: "/XRef",
  OBJECT_STREAM: "/ObjStm",
  METADATA_STREAM: "/Metadata",
} as const;
export type StreamType = typeof streamTypes[keyof typeof streamTypes];

export const userTypes = {
  INDIVIDUAL: "/Ind",
  TITLE: "/Title",
  ORGANIZATION: "/Org",
} as const;
export type UserTypes = typeof userTypes[keyof typeof userTypes];

export const dictTypes = {
  XREF: "/XRef",
  XOBJECT: "/XObject",
  CATALOG: "/Catalog",
  PAGE_TREE: "/Pages",
  PAGE: "/Page",
  ANNOTATION: "/Annot",
  BORDER_STYLE: "/Border",
  OPTIONAL_CONTENT_GROUP: "/OCG",
  OPTIONAL_CONTENT_MD: "/OCMD",
  EXTERNAL_DATA: "/ExDATA",
  ACTION: "/Action",
  MEASURE: "/Measure",
  DEV_EXTENSIONS: "/DeveloperExtensions",
  EMPTY: "",
} as const;
export type DictType = typeof dictTypes[keyof typeof dictTypes] | UserTypes;

export const valueTypes = {
  UNKNOWN: 0,
  NULL: 1,
  BOOLEAN: 2,
  NUMBER: 3,
  STRING_LITERAL: 4,
  STRING_HEX: 5,
  NAME: 6,
  ARRAY: 7,
  DICTIONARY: 8,
  STREAM: 9,
  REF: 10,
  COMMENT: 11,
} as const;
export type ValueType = typeof valueTypes[keyof typeof valueTypes];

//#region annotation const
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

/**
 * The name of an icon that shall be used in displaying the annotation
 */
export const annotationIconTypes = {
  COMMENT: "/Comment",
  KEY: "/Key",
  NOTE: "/Note",
  HELP: "/Help",
  NEW_PARAGRAPH: "/NewParagraph",
  PARAGRAPH: "/Paragraph",
  INSERT: "/Insert",
} as const;
export type AnnotationIconType = typeof annotationIconTypes[keyof typeof annotationIconTypes];
//#endregion

export const highlightingModes = {
  NO: "/N",
  INVERT: "/I",
  OUTLINE: "/O",
  PUSH: "/P",
} as const;
export type HighlightingMode = typeof highlightingModes[keyof typeof highlightingModes];

export const lineEndingTypes = {
  SQUARE: "/Square",
  CIRCLE: "/Circle",
  DIAMOND: "/Diamond",
  ARROW_OPEN: "/OpenArrow",
  ARROW_CLOSED: "/ClosedArrow",
  NONE: "/None",
  BUTT: "/Butt",
  ARROW_OPEN_R: "/ROpenArrow",
  ARROW_CLOSED_R: "/RClosedArrow",
  SLASH: "/Slash",
} as const;
export type LineEndingType = typeof lineEndingTypes[keyof typeof lineEndingTypes];

export const supportedFilters = new Set<string>([
  streamFilters.FLATE,
]);

export const maxGeneration = 65535;

export type Rect = [ll_x: number, ll_y: number, ur_x: number, ur_y: number];
