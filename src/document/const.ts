/**
 * PDF supports eight basic types of objects
 */
export const objectTypes = {
  NULL: 0,
  BOOLEAN: 1,
  NUMBER: 2,
  STRING: 3,
  NAME: 4,
  ARRAY: 5,
  DICTIONARY: 6,
  STREAM: 7,
} as const;

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
  ASCIIHEX: "/ASCIIHexDecode",
  ASCII85: "/ASCII85Decode",
  LZW: "/LZWDecode",
  FLATE: "/FlateDecode",
  RLX: "/RunLengthDecode",
  CCF: "/CCITTFaxDecode",
  JBIG2: "/JBIG2Decode",
  DCT: "/DCTDecode",
  JPX: "/JPXDecode",
  CRYPT: "/Crypt",
} as const;
export type StreamFilter = typeof streamFilters[keyof typeof streamFilters]; 

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
  FORM_X_OBJECT: "/XObject",
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
