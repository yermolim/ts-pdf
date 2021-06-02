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

//#region encryption
export const cryptVersions = {
  RC4_40: 1,
  RC4_128: 2,
  AES_128: 4,
  AES_256: 5,
} as const;
export type CryptVersion = typeof cryptVersions[keyof typeof cryptVersions]; 

export const cryptRevisions = {
  RC4_40: 2,
  RC4_128: 3,
  AES_128: 4,
  AES_256: 5,
  AES_256_V2: 6,
} as const;
export type CryptRevision = typeof cryptRevisions[keyof typeof cryptRevisions]; 

export const cryptMethods = {
  NONE: "/None",
  RC4: "/V2",
  AES_128: "/AESV2",
  AES_256: "/AESV3",
} as const;
export type CryptMethod = typeof cryptMethods[keyof typeof cryptMethods]; 

export const authEvents = {
  DOC_OPEN: "/DocOpen",
  EMBEDDED_OPEN: "/EFOpen",
} as const;
export type AuthEvent = typeof authEvents[keyof typeof authEvents]; 
//#endregion

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
  XREF: "/XRef",
  OBJECT_STREAM: "/ObjStm",
  FORM_XOBJECT: "/XObject",
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
  GRAPHICS_STATE: "/ExtGState",
  CRYPT_FILTER: "/CryptFilter",
  SOFT_MASK: "/Mask",
  GROUP: "/Group",
  FONT: "/Font",
  ENCODING: "/Encoding",
  EMPTY: "",
} as const;
export type DictType = typeof dictTypes[keyof typeof dictTypes] | UserTypes;

export const groupDictTypes = {
  TRANSPARENCY: "/Transparency",
} as const;
export type GroupDictType = typeof groupDictTypes[keyof typeof groupDictTypes];

/**value types that can be found in PDF file data */
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
  PROJECTION: "/Projection",
  RICH_MEDIA: "/RichMedia",
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

export type AnnotationState = AnnotationMarkedState | AnnotationReviewState;

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

//#region lines
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

export const lineCapStyles = {
  BUTT: 0,
  ROUND: 1,
  SQUARE: 2,
} as const;
export type LineCapStyle = typeof lineCapStyles[keyof typeof lineCapStyles];

export const lineJoinStyles = {
  MITER: 0,
  ROUND: 1,
  BEVEL: 2,
} as const;
export type LineJoinStyle = typeof lineJoinStyles[keyof typeof lineJoinStyles];
//#endregion

export const renderingIntents = {
  /**
   * Colours shall be represented solely with respect to the light source; 
   * no correction shall be made for the output medium’s white point 
   * (such as the colour of unprinted paper). Thus, for example, a monitor’s white point, 
   * which is bluish compared to that of a printer’s paper, 
   * would be reproduced with a blue cast. In-gamut colours shall bereproduced exactly; 
   * out-of-gamut colours shall be mapped to the nearest value within the reproducible gamut
   */
  ABSOLUTE: "/AbsoluteColorimetric",
  /**
   * Colours shall be represented with respect to the combination of the light source 
   * and the output medium’s white point (such as the colour of unprinted paper). 
   * Thus, a monitor’s white point can be reproduced on a printer 
   * by simply leaving the paper unmarked, ignoring colour differences between the two media. 
   * In-gamut colours shall be reproduced exactly; out-of-gamut colours shall bemapped 
   * to the nearest value within the reproducible gamut
   */
  RELATIVE: "/RelativeColorimetric",
  /**
   * Colours shall be represented in a manner that preserves or emphasizes saturation. 
   * Reproduction of in-gamut colours may or may not be colourimetrically accurate
   */
  SATURATION: "/Saturation",
  /**
   * Colours shall be represented in a manner that provides a pleasing perceptual appearance. 
   * To preserve colour relationships, both in-gamut and out-of-gamut colours 
   * shall be generally modified from their precise colourimetric values
   */
  PERCEPTUAL: "/Perceptual",
} as const;
export type RenderingIntent = typeof renderingIntents[keyof typeof renderingIntents];

export const blendModes = {
  /**
   * Selects the source colour, ignoring the backdrop
   */
  NORMAL: "/Normal",
  /**
   * Same as Normal. This mode exists only for compatibility and should not be used
   */
  COMPATIBLE: "/Compatible",
  /**
   * Multiplies the backdrop and source colour values. 
   * The result colour is always atleast as dark as either 
   * of the two constituent colours. Multiplying any colour with black produces black; 
   * multiplying with white leaves the original colour unchanged. 
   * Painting successive overlapping objects with a colour 
   * other than black or white produces progressively darker colours
   */
  MULTIPLY: "/Multiply",
  /**
   * The result colour is always at least as light as either 
   * of the two constituent colours. Screening any colour with white produces white; 
   * screening with black leaves the original colour unchanged. 
   * The effect is similar to projecting multiple photographic 
   * slides simultaneously onto a single screen
   */
  SCREEN: "/Screen",
  /**
   * Multiplies or screens the colours, depending on the backdrop colour value. 
   * Source colours overlay the backdrop while preserving its highlights and shadows. 
   * The backdrop colour is not replaced but is mixed with the source colour 
   * to reflect the lightness or darkness of the backdrop
   */
  OVERLAY: "/Overlay",
  /**
   * Selects the darker of the backdrop and source colours. 
   * The backdrop is replaced with the source where the source is darker; 
   * otherwise, it is left unchanged
   */
  DARKEN: "/Darken",
  /**
   * Selects the lighter of the backdrop and source colours. 
   * The backdrop is replaced with the source where the source is lighter; 
   * otherwise, it is left unchanged
   */
  LIGHTEN: "/Lighten",
  /**
   * Brightens the backdrop colour to reflect the source colour. 
   * Painting with black produces no changes
   */
  COLOR_DODGE: "/ColorDodge",
  /**
   * Darkens the backdrop colour to reflect the source colour. 
   * Painting with white produces no change
   */
  COLOR_BURN: "/ColorBurn",
  /**
   * Multiplies or screens the colours, depending on the source colour value. 
   * The effect is similar to shining a harsh spotlight on the backdrop
   */
  HARD_LIGHT: "/HardLight",
  /**
   * Darkens or lightens the colours, depending on the source colour value. 
   * The effect is similar to shining a diffused spotlight on the backdrop
   */
  SOFT_LIGHT: "/SoftLight",
  /**
   * Subtracts the darker of the two constituent colours from the lighter colour. 
   * Painting with white inverts the backdrop colour; painting with black produces no change
   */
  DIFFERENCE: "/Difference",
  /**
   * Produces an effect similar to that of the Difference mode but lower in contrast. 
   * Painting with white inverts the backdrop colour; painting with black produces no change
   */
  EXCLUSION: "/Exclusion",
} as const;
export type BlendMode = typeof blendModes[keyof typeof blendModes];

export const textRenderModes = {
  FILL: 0,
  STROKE: 1,
  FILL_STROKE: 2,
  INVISIBLE: 3,
  FILL_USE_AS_CLIP: 4,
  STROKE_USE_AS_CLIP: 5,
  FILL_STROKE_USE_AS_CLIP: 6,
  USE_AS_CLIP: 7,
} as const;
export type TextRenderMode = typeof textRenderModes[keyof typeof textRenderModes];

export const colorSpaces = {
  GRAYSCALE: "/DeviceGray",
  RGB: "/DeviceRGB",
  CMYK: "/DeviceCMYK",

  // CIE_GRAYSCALE: "/CalGray",
  // CIE_RGB: "/CalRGB",
  // CIE_LAB: "/Lab",
  // CIE_ICC: "/ICCBased",

  SPECIAL: "/DeviceN",
  SPECIAL_INDEXED: "/Indexed",
  SPECIAL_PATTERN: "/Pattern",
  SPECIAL_SEPARATION: "/Separation",
} as const;
export type ColorSpace = typeof colorSpaces[keyof typeof colorSpaces];

export const softMaskTypes = {
  ALPHA: "/Alpha",
  LUMINOSITY: "/Luminosity",
} as const;
export type SoftMaskType = typeof softMaskTypes[keyof typeof softMaskTypes];

export const baseFonts = {
  TNR: "/Times-Roman",
  TNR_B: "/Times-Bold",
  TNR_I: "/Times-Italic",
  TNR_BI: "/Times-BoldItalic",
  HELV: "/Helvetica",
  HELV_B: "/Helvetica-Bold",
  HELV_I: "/Helvetica-Oblique",
  HELV_BI: "/Helvetica-BoldOblique",
  COUR: "/Courier",
  COUR_B: "/Courier-Bold",
  COUR_I: "/Courier-Oblique",
  COUR_BI: "/Courier-BoldOblique",
  SYMBOL: "/Symbol",
  ZAPF: "/ZapfDingbats",
} as const;
export type BaseFont = typeof baseFonts[keyof typeof baseFonts];


export const supportedFilters = new Set<string>([
  streamFilters.FLATE,
  streamFilters.DCT,
  streamFilters.JBIG2,
  streamFilters.JPX,
]);

/**max PDF object generation */
export const maxGeneration = 65535;
