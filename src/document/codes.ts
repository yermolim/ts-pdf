/**the most used char codes from the ASCII set */
export const codes = {
  NULL: 0,
  BACKSPACE: 8,
  HORIZONTAL_TAB: 9,
  LINE_FEED: 10,
  VERTICAL_TAB: 11,
  FORM_FEED: 12,
  CARRIAGE_RETURN: 13,
  WHITESPACE: 32,
  EXCLAMATION_MARK: 33,
  DOUBLE_QUOTE: 34,
  HASH: 35,
  DOLLAR: 36,
  PERCENT: 37,
  AMPERSAND: 38,
  QUOTE: 39,
  L_PARENTHESE: 40,
  R_PARENTHESE: 41,
  ASTERISK: 42,
  PLUS: 43,
  COMMA: 44,
  MINUS: 45,
  DOT: 46,
  SLASH: 47,
  D_0: 48,
  D_1: 49,
  D_2: 50,
  D_3: 51,
  D_4: 52,
  D_5: 53,
  D_6: 54,
  D_7: 55,
  D_8: 56,
  D_9: 57,
  COLON: 58,
  SEMICOLON: 59,
  LESS: 60,
  EQUAL: 61,
  GREATER: 62,
  QUESTION_MARK: 63,
  AT: 64,
  A: 65,
  B: 66,
  C: 67,
  D: 68,
  E: 69,
  F: 70,
  G: 71,
  H: 72,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  M: 77,
  N: 78,
  O: 79,
  P: 80,
  Q: 81,
  R: 82,
  S: 83,
  T: 84,
  U: 85,
  V: 86,
  W: 87,
  X: 88,
  Y: 89,
  Z: 90,
  L_BRACKET: 91,
  BACKSLASH: 92,
  R_BRACKET: 93,
  CARET: 94,
  UNDERSCORE: 95,
  BACKTICK: 96,
  a: 97,
  b: 98,
  c: 99,
  d: 100,
  e: 101,
  f: 102,
  g: 103,
  h: 104,
  i: 105,
  j: 106,
  k: 107,
  l: 108,
  m: 109,
  n: 110,
  o: 111,
  p: 112,
  q: 113,
  r: 114,
  s: 115,
  t: 116,
  u: 117,
  v: 118,
  w: 119,
  x: 120,
  y: 121,
  z: 122,
  L_BRACE: 123,
  VERTICAL_LINE: 124,
  R_BRACE: 125,
  TILDE: 126,
} as const;

/**char code sequences commonly used in PDF data */
export const keywordCodes = {
  NULL: [codes.n, codes.u, codes.l, codes.l],

  OBJ: [codes.o, codes.b, codes.j],
  OBJ_END: [codes.e, codes.n, codes.d, codes.o, codes.b, codes.j],

  STREAM_START: [codes.s, codes.t, codes.r, codes.e, codes.a, codes.m],
  STREAM_END: [codes.e, codes.n, codes.d,
    codes.s, codes.t, codes.r, codes.e, codes.a, codes.m],

  DICT_START: [codes.LESS, codes.LESS],
  DICT_END: [codes.GREATER, codes.GREATER],

  ARRAY_START: [codes.L_BRACKET],
  ARRAY_END: [codes.R_BRACKET],
  
  STR_LITERAL_START: [codes.L_PARENTHESE],
  STR_LITERAL_END: [codes.R_PARENTHESE],

  STR_HEX_START: [codes.LESS],
  STR_HEX_END: [codes.GREATER],

  VERSION: [codes.PERCENT, codes.P, codes.D, codes.F, codes.MINUS],

  PREV: [codes.SLASH, codes.P, codes.r, codes.e, codes.v],
  TYPE: [codes.SLASH, codes.T, codes.y, codes.p, codes.e],
  SUBTYPE: [codes.SLASH, codes.S, codes.u, codes.b, codes.t, codes.y, codes.p, codes.e],
  FORM: [codes.SLASH, codes.F, codes.o, codes.r, codes.m],
  
  XREF_TABLE: [codes.x, codes.r, codes.e, codes.f],
  XREF_STREAM: [codes.SLASH, codes.X, codes.R, codes.e, codes.f],
  XREF_HYBRID: [codes.X, codes.R, codes.e, codes.f, codes.S, codes.t, codes.m],
    
  XREF_START: [codes.s, codes.t, codes.a, codes.r, codes.t, 
    codes.x, codes.r, codes.e, codes.f],
  TRAILER: [codes.t, codes.r, codes.a, codes.i, codes.l, codes.e, codes.r],
  END_OF_FILE: [codes.PERCENT, codes.PERCENT, codes.E, codes.O, codes.F],

  END_OF_LINE: [codes.CARRIAGE_RETURN, codes.LINE_FEED],

  TRUE: [codes.t, codes.r, codes.u, codes.e],
  FALSE: [codes.f, codes.a, codes.l, codes.s, codes.e],
} as const;

/**
 * The delimiter  characters (, ), <, >, [, ], {, }, /,  and  %  are  special.  
 * They delimit syntactic entities such as strings, arrays, names, and comments.  
 * Any of these characters terminates the entity preceding it and is not included in the entity. 
 */
export const DELIMITER_CHARS = new Set<number>([
  codes.PERCENT,
  codes.L_PARENTHESE,
  codes.R_PARENTHESE,
  codes.SLASH,
  codes.LESS,
  codes.GREATER,
  codes.L_BRACKET,
  codes.R_BRACKET,
  codes.L_BRACE,
  codes.R_BRACE,
]);

/**
 * White-space characters separate syntactic constructs such as names and numbers from each other.  
 * All white-space characters are  equivalent, except in comments, strings, and streams. 
 * In all other contexts, PDF treats any sequence of consecutive white-space characters as one character.
 */
export const SPACE_CHARS = new Set<number>([
  codes.NULL,
  codes.HORIZONTAL_TAB,
  codes.LINE_FEED,
  codes.FORM_FEED,
  codes.CARRIAGE_RETURN,
  codes.WHITESPACE,
]);

export const DIGIT_CHARS = new Set<number>([
  codes.D_0,
  codes.D_1,
  codes.D_2,
  codes.D_3,
  codes.D_4,
  codes.D_5,
  codes.D_6,
  codes.D_7,
  codes.D_8,
  codes.D_9,
]);

/**
 * Each line is terminated by an end-of-line (EOL) marker
 */
export const EOL = [
  codes.CARRIAGE_RETURN, 
  codes.LINE_FEED,
] as const;

/**
 * check if the char is not a space char or a delimiter char
 * @param code char code
 * @returns 
 */
export function isRegularChar(code: number): boolean {
  if (isNaN(code)) {
    return false;
  }
  return !DELIMITER_CHARS.has(code) && !SPACE_CHARS.has(code);
}

export function isDigit(code: number): boolean {
  return DIGIT_CHARS.has(code);
}
