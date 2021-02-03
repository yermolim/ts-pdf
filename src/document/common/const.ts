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

export const supportedFilters = new Set<string>([
  streamFilters.FLATE,
]);
