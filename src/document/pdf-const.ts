export const charCodes = {
  NULL: 0,
  TAB: 9,
  LINE_FEED: 10,
  FORM_FEED: 12,
  CARRIAGE_RETURN: 13,
  WHITESPACE: 32,
  PERCENT: 37,
  L_PARENTHESE: 40,
  R_PARENTHESE: 41,
  SLASH: 47,
  LESS: 60,
  GREATER: 62,
  L_BRACKET: 91,
  BACKSLASH: 92,
  R_BRACKET: 93,
  L_BRACE: 123,
  R_BRACE: 125,
};

/**
 * PDF supports eight basic types of objects
 */
const objectTypes = {
  NULL: 0,
  BOOLEAN: 1,
  NUMBER: 2,
  STRING: 3,
  NAME: 4,
  ARRAY: 5,
  DICTIONARY: 6,
  STREAM: 7,
};

/**
 * Cross-reference tables are used in PDF pre-1.5,
 * cross-reference streams are used in PDF 1.5+,
 * hybrid cross-reference sections are used to support opening PDF 1.5+ in pre-1.4 readers.
 */
const xRefTypes = {
  TABLE: 0,
  STREAM: 1,
  HYBRID: 2,
};

/**
 * Each entry in a cross-reference stream has one or more fields, 
 * the first of which designates the entry’s type. 
 * In PDF 1.5, only types 0, 1, and 2 are allowed.  
 * Any  other  value  is  interpreted  as  a  reference  to  the  null  object, 
 * thus  permitting new entry types to be defined in the future.
 */
const crsEntryTypes = {
  FREED: 0,
  NORMAL: 0,
  COMPRESSED: 0,
};

/**
 * The delimiter  characters (, ), <, >, [, ], {, }, /,  and  %  are  special.  
 * They  delimit  syntactic  entities  such  as  strings,  arrays,  names,  and  comments.  
 * Any  of  these  characters terminates the entity preceding it and is not included in the entity. 
 */
const DELIMITER_CHARS = new Set<number>([
  charCodes.PERCENT,
  charCodes.L_PARENTHESE,
  charCodes.R_PARENTHESE,
  charCodes.SLASH,
  charCodes.LESS,
  charCodes.GREATER,
  charCodes.L_BRACKET,
  charCodes.R_BRACKET,
  charCodes.L_BRACE,
  charCodes.R_BRACE,
]);

/**
 * White-space characters separate syntactic constructs such as names and  numbers  from  each  other.  
 * All  white-space  characters  are  equivalent,  except  in comments, strings, and streams. 
 * In all other contexts, PDF treats any sequence of consecutive white-space characters as one character.
 */
const SPACE_CHARS = new Set<number>([
  charCodes.NULL,
  charCodes.TAB,
  charCodes.LINE_FEED,
  charCodes.FORM_FEED,
  charCodes.CARRIAGE_RETURN,
  charCodes.WHITESPACE,
]);

/**
 * Each line is terminated by an end-of-line (EOL)  marker
 */
const EOL = [charCodes.CARRIAGE_RETURN, charCodes.LINE_FEED];
