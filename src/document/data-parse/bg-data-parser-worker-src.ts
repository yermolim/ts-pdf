// planning to use worker to prevent UI thread from blocking

export const workerSrc = /*javascript*/`
/**the most used char codes from the ASCII set */
const codes = {
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
};

/**char code sequences commonly used in PDF data */
const keywordCodes = {
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

  CMAP_BEGIN: [codes.b, codes.e, codes.g, codes.i, codes.n,
    codes.c, codes.m, codes.a, codes.p],
  CMAP_END: [codes.e, codes.n, codes.d,
    codes.c, codes.m, codes.a, codes.p],
  CMAP_BEGIN_CODE_RANGE: [codes.b, codes.e, codes.g, codes.i, codes.n,
    codes.c, codes.o, codes.d, codes.e, codes.s, codes.p, codes.a, codes.c, codes.e,
    codes.r, codes.a, codes.n, codes.g, codes.e],
  CMAP_END_CODE_RANGE: [codes.e, codes.n, codes.d,
    codes.c, codes.o, codes.d, codes.e, codes.s, codes.p, codes.a, codes.c, codes.e,
    codes.r, codes.a, codes.n, codes.g, codes.e],
  CMAP_BEGIN_CHAR: [codes.b, codes.e, codes.g, codes.i, codes.n,
    codes.b, codes.f, codes.c, codes.h, codes.a, codes.r],
  CMAP_END_CHAR: [codes.e, codes.n, codes.d,
    codes.b, codes.f, codes.c, codes.h, codes.a, codes.r],
  CMAP_BEGIN_RANGE: [codes.b, codes.e, codes.g, codes.i, codes.n,
    codes.b, codes.f, codes.r, codes.a, codes.n, codes.g, codes.e],
  CMAP_END_RANGE: [codes.e, codes.n, codes.d,
    codes.b, codes.f, codes.r, codes.a, codes.n, codes.g, codes.e],

  AP_STREAM_TEXT_END: [codes.E, codes.T],
};

/**value types that can be found in PDF file data */
const valueTypes = {
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
};

//#region static collections
/**
 * Each line is terminated by an end-of-line (EOL) marker
 */
// const EOL = [
//   codes.CARRIAGE_RETURN, 
//   codes.LINE_FEED,
// ];
  
/**
 * The delimiter  characters (, ), <, >, [, ], {, }, /,  and  %  are  special.  
 * They delimit syntactic entities such as strings, arrays, names, and comments.  
 * Any of these characters terminates the entity preceding it and is not included in the entity. 
 */
const delimiterChars = new Set([
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
const spaceChars = new Set([
  codes.NULL,
  codes.HORIZONTAL_TAB,
  codes.LINE_FEED,
  codes.FORM_FEED,
  codes.CARRIAGE_RETURN,
  codes.WHITESPACE,
]);
  
const digitChars = new Set([
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

const newLineChars = new Set([
  codes.CARRIAGE_RETURN,
  codes.LINE_FEED,
]);
//#endregion

//#region static check functions
/**
 * check if the char is not a space char or a delimiter char
 * @param code char code
 * @returns 
 */
function isRegularChar(code) {
  if (isNaN(code)) {
    return false;
  }
  return !delimiterChars.has(code) && !spaceChars.has(code);
}

/**
 * check if the char is a space char or a delimiter char
 * @param code char code
 * @returns 
 */
function isNotRegularChar(code) {
  if (isNaN(code)) {
    return true;
  }
  return delimiterChars.has(code) || spaceChars.has(code);
}

function isDigit(code) {
  return digitChars.has(code);
}

function isNewLineChar(code) {
  return newLineChars.has(code);
}

function isSpaceChar(code) {
  return spaceChars.has(code);
}

function isNotSpaceChar(code) {
  return !spaceChars.has(code);
}

function isDelimiterChar(code) {
  return delimiterChars.has(code);
}

function isNotDelimiterChar(code) {
  return !delimiterChars.has(code);
}
//#endregion

let _data = new Uint8Array();
let _maxIndex = 0;

const _messageQueue = [];
let _busy = false;

self.onmessage = (event) => {
  if (_busy) {
    _messageQueue.push(event);
  } else {
    _busy = true;
    processData(event.data);
  }
};

function sendResponse(response) {
  self.postMessage(response);
  if (_messageQueue.length) {
    processData(_messageQueue.shift().data);
  } else {
    _busy = false;
  }
}

function processData(data) {
  const id = data.id;
  const name = data.name;

  if (name === "data-set") {
    if (data.bytes) {      
      const dataBytesArray = new Uint8Array(data.bytes);
      if (dataBytesArray?.length) {
        _data = dataBytesArray;
        _maxIndex = dataBytesArray.length - 1;
        sendResponse({id, name, type: "success"});
        return;
      }
    }
    sendResponse({id, name, type: "error", 
      message: "data-set: byte array is null or empty"});
    return; 
  }
  
  if (name === "data-reset") {
    const buffer = _data.buffer;
    _data = new Uint8Array();
    _maxIndex = 0;
    sendResponse({id, name, type: "success", bytes: buffer}, [buffer]);
    return; 
  }

  // console.log(JSON.stringify(data));
  try {
    let result;
    switch (name) { 
    // common cases
    case "is-outside":
      result = isOutside(...data.args);
      break;
    case "is-code-at":
      result = isCodeAt(...data.args);
      break;
    case "get-value-type-at":
      result = getValueTypeAt(...data.args);
      break;
    // search cases
    case "find-subarray-index":
      result = findSubarrayIndex(...data.args);
      break;
    case "find-char-index":
      result = findCharIndex(...data.args);
      break;
    case "find-new-line-index":
      result = findNewLineIndex(...data.args);
      break;
    case "find-space-index":result = findSpaceIndex(...data.args);
      break;
    case "find-non-space-index":
      result = findNonSpaceIndex(...data.args);
      break;
    case "find-delimiter-index":
      result = findDelimiterIndex(...data.args);
      break;
    case "find-non-delimiter-index":
      result = findNonDelimiterIndex(...data.args);
      break;
    case "find-regular-index":
      result = findRegularIndex(...data.args);
      break;
    case "find-irregular-index":
      result = findIrregularIndex(...data.args);
      break;
    // getting bounds cases  
    case "get-indirect-object-bounds":
      result = getIndirectObjectBoundsAt(...data.args);
      break;
    case "get-xref-table-bounds":
      result = getXrefTableBoundsAt(...data.args);
      break;
    case "get-dict-bounds":
      result = getDictBoundsAt(...data.args);
      break;
    case "get-array-bounds":
      result = getArrayBoundsAt(...data.args);
      break;
    case "get-hex-bounds":
      result = getHexBoundsAt(...data.args);
      break;
    case "get-literal-bounds":
      result = getLiteralBoundsAt(...data.args);
      break;
    // parsing cases
    case "parse-number":
      result = parseNumberAt(...data.args);
      break;
    case "parse-name":
      result = parseNameAt(...data.args);
      break;
    case "parse-string":
      result = parseStringAt(...data.args);
      break;
    case "parse-bool":
      result = parseBoolAt(...data.args);
      break;
    case "parse-number-array":
      result = parseNumberArrayAt(...data.args);
      break;
    case "parse-name-array":
      result = parseNameArrayAt(...data.args);
      break;
    case "parse-dict-type":
      result = parseDictType(...data.args);
      break;
    case "parse-dict-subtype":
      result = parseDictSubtype(...data.args);
      break;
    case "parse-dict-property-by-name":
      result = parseDictPropertyByName(...data.args);
      break;
    // skip cases
    case "skip-empty":
      result = skipEmptyChars(...data.args);
      break;
    case "skip-to-next-name":
      result = skipToNextName(...data.args);
      break;
    // getting char/codes cases
    case "slice-char-codes":
      result = sliceCharCodes(...data.args);
      break;
    case "slice-chars":
      result = sliceChars(...data.args);
      break;
    case "get-char-code":
      result = getCharCode(...data.args);
      break;
    default:
      throw new Error("Unknown command name: " + name);
    }    
    // console.log(JSON.stringify(result));
    sendResponse({id, name, type: "success", result});
  } catch (e) {
    // console.log(JSON.stringify(e));
    sendResponse({id, name, type: "error", message: e.message});
  }
}

//#region common functions  
function isOutside(index) {
  return (index < 0 || index > _maxIndex);
}

function isCodeAt(index, code) {
  return getCharCode(index) === code;
}

function getValueTypeAt(start, skipEmpty = true)  {
  if (skipEmpty) {
    start = skipEmptyChars(start);
  }
  if (isOutside(start)) {
    return null;
  }

  const arr = _data;
  const i = start;
  const charCode = arr[i];

  let tempIndex;
  switch (charCode) {
  case codes.SLASH:
    if (isRegularChar(arr[i + 1])) {
      return valueTypes.NAME;
    } 
    return valueTypes.UNKNOWN;
  case codes.L_BRACKET:
    return valueTypes.ARRAY;
  case codes.L_PARENTHESE:
    return valueTypes.STRING_LITERAL;
  case codes.LESS:
    if (codes.LESS === arr[i + 1]) {          
      return valueTypes.DICTIONARY;
    }
    return valueTypes.STRING_HEX;
  case codes.PERCENT:
    return valueTypes.COMMENT;
  case codes.D_0:
  case codes.D_1:
  case codes.D_2:
  case codes.D_3:
  case codes.D_4:
  case codes.D_5:
  case codes.D_6:
  case codes.D_7:
  case codes.D_8:
  case codes.D_9:
    tempIndex = findDelimiterIndex(true, i + 1);
    if (tempIndex !== -1) {
      const refEndIndex = findCharIndex(codes.R, false, tempIndex - 1);
      if (refEndIndex !== -1 && refEndIndex > i && !isRegularChar(arr[refEndIndex + 1])) {
        return valueTypes.REF;
      }
    }
    return valueTypes.NUMBER;
  case codes.DOT:
  case codes.MINUS:
    if (isDigit(arr[i + 1])) {          
      return valueTypes.NUMBER;
    }
    return valueTypes.UNKNOWN;
  case codes.s:
    if (arr[i + 1] === codes.t
        && arr[i + 2] === codes.r
        && arr[i + 3] === codes.e
        && arr[i + 4] === codes.a
        && arr[i + 5] === codes.m) {
      return valueTypes.STREAM;
    }
    return valueTypes.UNKNOWN;
  case codes.t:
    if (arr[i + 1] === codes.r
        && arr[i + 2] === codes.u
        && arr[i + 3] === codes.e) {
      return valueTypes.BOOLEAN;
    }
    return valueTypes.UNKNOWN;
  case codes.f:
    if (arr[i + 1] === codes.a
        && arr[i + 2] === codes.l
        && arr[i + 3] === codes.s
        && arr[i + 4] === codes.e) {
      return valueTypes.BOOLEAN;
    }
    return valueTypes.UNKNOWN;
  default:
    return valueTypes.UNKNOWN;
  }
} 
//#endregion

//#region search functions
function findSubarrayIndex(sub, options) {
  const arr = _data;
  if (!sub?.length) {
    return null;
  }

  const direction = options?.direction ?? true;
  const minIndex = Math.max(Math.min(options?.minIndex ?? 0, _maxIndex), 0);
  const maxIndex = Math.max(Math.min(options?.maxIndex ?? _maxIndex, _maxIndex), 0);
  const allowOpened = !options?.closedOnly;

  let i = direction
    ? minIndex
    : maxIndex; 

  let j; 
  if (direction) { 
    outer_loop:
    for (i; i <= maxIndex; i++) {
      for (j = 0; j < sub.length; j++) {
        if (arr[i + j] !== sub[j]) {
          continue outer_loop;
        }
      }
      if (allowOpened || !isRegularChar(arr[i + j])) {
        return {start: i, end: i + j - 1};
      }
    }
  } else {
    const subMaxIndex = sub.length - 1;
    outer_loop:
    for (i; i >= minIndex; i--) {
      for (j = 0; j < sub.length; j++) {
        if (arr[i - j] !== sub[subMaxIndex - j]) {
          continue outer_loop;
        }
      }
      if (allowOpened || !isRegularChar(arr[i - j])) {
        return {start: i - j + 1, end: i};
      }
    }
  }

  return null;
}

function findCharIndex(charCode, direction = true, start = undefined) {    

  const arr = _data;
  let i = isNaN(start)
    ? direction
      ? 0
      : _maxIndex
    : start; 

  if (direction) {        
    for (i; i <= _maxIndex; i++) {
      if (arr[i] === charCode) {
        return i;
      }
    }    
  } else {        
    for (i; i >= 0; i--) {
      if (arr[i] === charCode) {
        return i;
      }
    }
  }

  return -1; 
}

function findNewLineIndex(direction = true, start = undefined) {
  let lineBreakIndex;     

  const arr = _data;
  let i = isNaN(start)
    ? direction
      ? 0
      : _maxIndex
    : start; 
    
  if (direction) {        
    for (i; i <= _maxIndex; i++) {
      if (isNewLineChar(arr[i])) {
        lineBreakIndex = i;
        break;
      }
    }    
  } else {        
    for (i; i >= 0; i--) {
      if (isNewLineChar(arr[i])) {
        lineBreakIndex = i;
        break;
      }
    }
  }

  if (lineBreakIndex === undefined) {
    return -1;
  }

  if (direction) {  
    if (_data[lineBreakIndex] === codes.CARRIAGE_RETURN 
      && _data[lineBreakIndex + 1] === codes.LINE_FEED) {
      lineBreakIndex++;
    }  
    return Math.min(lineBreakIndex + 1, _maxIndex);
  } else {        
    if (_data[lineBreakIndex] === codes.LINE_FEED 
      && _data[lineBreakIndex - 1] === codes.CARRIAGE_RETURN) {
      lineBreakIndex--;
    }  
    return Math.max(lineBreakIndex - 1, 0);
  }
}

function findSpaceIndex(direction = true, start = undefined) {
  const arr = _data;
  let i = isNaN(start)
    ? direction
      ? 0
      : _maxIndex
    : start; 
    
  if (direction) {        
    for (i; i <= _maxIndex; i++) {
      if (isSpaceChar(arr[i])) {
        return i;
      }
    }    
  } else {        
    for (i; i >= 0; i--) {
      if (isSpaceChar(arr[i])) {
        return i;
      }
    }
  }
  
  return -1;
}

function findNonSpaceIndex(direction = true, start = undefined) {
  const arr = _data;
  let i = isNaN(start)
    ? direction
      ? 0
      : _maxIndex
    : start; 
    
  if (direction) {        
    for (i; i <= _maxIndex; i++) {
      if (isNotSpaceChar(arr[i])) {
        return i;
      }
    }    
  } else {        
    for (i; i >= 0; i--) {
      if (isNotSpaceChar(arr[i])) {
        return i;
      }
    }
  }
  
  return -1;
}

function findDelimiterIndex(direction = true, start = undefined) {
  const arr = _data;
  let i = isNaN(start)
    ? direction
      ? 0
      : _maxIndex
    : start; 
    
  if (direction) {        
    for (i; i <= _maxIndex; i++) {
      if (isDelimiterChar(arr[i])) {
        return i;
      }
    }    
  } else {        
    for (i; i >= 0; i--) {
      if (isDelimiterChar(arr[i])) {
        return i;
      }
    }
  }
  
  return -1; 
}

function findNonDelimiterIndex(direction = true, start = undefined) {    
  const arr = _data;
  let i = isNaN(start)
    ? direction
      ? 0
      : _maxIndex
    : start; 
    
  if (direction) {        
    for (i; i <= _maxIndex; i++) {
      if (isNotDelimiterChar(arr[i])) {
        return i;
      }
    }    
  } else {        
    for (i; i >= 0; i--) {
      if (isNotDelimiterChar(arr[i])) {
        return i;
      }
    }
  }
  
  return -1;
}

function findRegularIndex(direction = true, start = undefined) {
  const arr = _data;
  let i = isNaN(start)
    ? direction
      ? 0
      : _maxIndex
    : start; 
    
  if (direction) {        
    for (i; i <= _maxIndex; i++) {
      if (isRegularChar(arr[i])) {
        return i;
      }
    }    
  } else {        
    for (i; i >= 0; i--) {
      if (isRegularChar(arr[i])) {
        return i;
      }
    }
  }
  
  return -1;
}

function findIrregularIndex(direction = true, start = undefined) {  
  const arr = _data;
  let i = isNaN(start)
    ? direction
      ? 0
      : _maxIndex
    : start; 
    
  if (direction) {        
    for (i; i <= _maxIndex; i++) {
      if (isNotRegularChar(arr[i])) {
        return i;
      }
    }    
  } else {        
    for (i; i >= 0; i--) {
      if (isNotRegularChar(arr[i])) {
        return i;
      }
    }
  }
  
  return -1;
}
//#endregion

//#region get bounds functions  
function getIndirectObjectBoundsAt(start, skipEmpty = true) {   
  if (skipEmpty) {
    start = skipEmptyChars(start);
  }
  if (isOutside(start)) {
    return null;
  }    

  const objStartIndex = findSubarrayIndex(keywordCodes.OBJ, 
    {minIndex: start, closedOnly: true});
  if (!objStartIndex) {
    return null;
  }      

  let contentStart = findNonSpaceIndex(true, objStartIndex.end + 1);
  if (contentStart === -1){
    return null;
  }    
  const objEndIndex = findSubarrayIndex(keywordCodes.OBJ_END, 
    {minIndex: contentStart, closedOnly: true});
  if (!objEndIndex) {
    return null;
  }
  let contentEnd = findNonSpaceIndex(false, objEndIndex.start - 1);

  if (getCharCode(contentStart) === codes.LESS
      && getCharCode(contentStart + 1) === codes.LESS
      && getCharCode(contentEnd - 1) === codes.GREATER
      && getCharCode(contentEnd) === codes.GREATER) {
    // object is dict. exclude bounds from content
    contentStart += 2;
    contentEnd -=2;
  }

  return {
    start: objStartIndex.start, 
    end: objEndIndex.end,
    contentStart,
    contentEnd,
  };
} 
  
function getXrefTableBoundsAt(start, skipEmpty = true) {   
  if (skipEmpty) {
    start = skipEmptyChars(start);
  }
  if (isOutside(start) || _data[start] !== codes.x) {
    return null;
  }

  const xrefStart = findSubarrayIndex(keywordCodes.XREF_TABLE, 
    {minIndex: start});
  if (!xrefStart) {
    return null;
  }     
  const contentStart = findNonSpaceIndex(true, xrefStart.end + 1);
  if (contentStart === -1){
    return null;
  }   
  const xrefEnd = findSubarrayIndex(keywordCodes.TRAILER, 
    {minIndex: xrefStart.end + 1});
  if (!xrefEnd) {
    return null;
  } 
  const contentEnd = findNonSpaceIndex(false, xrefEnd.start - 1);

  if (contentEnd < contentStart) {
    // should be only possible in an empty xref, which is not allowed
    return null;
  }

  return {
    start: xrefStart.start, 
    end: xrefEnd.end,
    contentStart,
    contentEnd,
  };
}

function getDictBoundsAt(start, skipEmpty = true) {   
  if (skipEmpty) {
    start = skipEmptyChars(start);
  }
  if (isOutside(start) 
      || _data[start] !== codes.LESS
      || _data[start + 1] !== codes.LESS) {
    return null;
  }
     
  const contentStart = findNonSpaceIndex(true, start + 2);
  if (contentStart === -1){
    return null;
  }  
    
  let dictOpened = 1;
  let dictBound = true;
  let literalOpened = 0;
  let i = contentStart;    
  let code;
  let prevCode;
  while (dictOpened) {
    prevCode = code;
    code = _data[i++];

    if (code === codes.L_PARENTHESE
        && (!literalOpened || prevCode !== codes.BACKSLASH)) {
      // increase string literal nesting
      literalOpened++;
    }

    if (code === codes.R_PARENTHESE
        && (literalOpened && prevCode !== codes.BACKSLASH)) {
      // decrease string literal nesting
      literalOpened--;
    }

    if (literalOpened) {
      // ignore 'less' and 'greater' signs while being inside a literal
      continue;
    }

    if (!dictBound) {
      if (code === codes.LESS && code === prevCode) {
        dictOpened++;
        dictBound = true;
      } else if (code === codes.GREATER && code === prevCode) {
        dictOpened--;
        dictBound = true;
      }
    } else {        
      dictBound = false;
    }
  }
  const end = i - 1;
 
  const contentEnd = findNonSpaceIndex(false, end - 2);
  if (contentEnd < contentStart) {
    // should be possible only in an empty dict
    return {
      start, 
      end,
    };
  }

  return {
    start, 
    end,
    contentStart,
    contentEnd,
  };
}
  
function getArrayBoundsAt(start, skipEmpty = true) {
  if (skipEmpty) {
    start = skipEmptyChars(start);
  }
  if (isOutside(start) || _data[start] !== codes.L_BRACKET) {
    return null;
  }

  let arraysOpened = 1;
  let i = start + 1;    
  let code;
  while (arraysOpened) {
    code = _data[i++];
    if (code === codes.L_BRACKET) {
      arraysOpened++;
    } else if (code === codes.R_BRACKET) {
      arraysOpened--;
    }
  }
  const arrayEnd = i - 1;
  if (arrayEnd - start < 1) {
    return null;
  }

  return {start, end: arrayEnd};
}
      
function getHexBoundsAt(start, skipEmpty = true) {   
  if (skipEmpty) {
    start = skipEmptyChars(start);
  }
  if (isOutside(start) || getCharCode(start) !== codes.LESS) {
    return null;
  }

  const end = findCharIndex(codes.GREATER, true, start + 1);
  if (end === -1) {
    return null;
  }

  return {start, end};
}  

function getLiteralBoundsAt(start, skipEmpty = true) {       
  if (skipEmpty) {
    start = skipEmptyChars(start);
  }
  if (isOutside(start) || getCharCode(start) !== codes.L_PARENTHESE) {
    return null;
  }

  let i = start;
  let code;
  let escaped = false;
  let opened = 0;

  while (opened || code !== codes.R_PARENTHESE || escaped) {
    if (i > _maxIndex) {
      return null;
    }

    code = getCharCode(i++);

    if (!escaped) {
      if (code === codes.L_PARENTHESE) {
        opened += 1;
      } else if (opened && code === codes.R_PARENTHESE) {
        opened -= 1;
      }
    }
      
    if (!escaped && code === codes.BACKSLASH) {
      escaped = true;
    } else {
      escaped = false;
    }
  }

  return {start, end: i - 1};
}
//#endregion

//#region parse functions 
function parseNumberAt(start, float = false, skipEmpty = true) {
  if (skipEmpty) {
    start = skipEmptyChars(start);
  }
  if (isOutside(start) || !isRegularChar(_data[start])) {
    return null;
  }

  let i = start;
  let numberStr = "";
  let value = _data[i];
  if (value === codes.MINUS) {
    numberStr += "-";
    value = _data[++i];
  } else if (value === codes.DOT) {
    numberStr += "0.";
    value = _data[++i];
  }
  while (isDigit(value)
      || (float && value === codes.DOT)) {
    numberStr += String.fromCharCode(value);
    value = _data[++i];
  }

  return numberStr 
    ? {value: +numberStr, start, end: i - 1}
    : null;
}
  
function parseNameAt(start, includeSlash = true, skipEmpty = true) {
  if (skipEmpty) {
    start = skipEmptyChars(start);
  }
  if (isOutside(start) || _data[start] !== codes.SLASH) {
    return null;
  }

  let i = start + 1;
  let result = includeSlash
    ? "/"
    : "";
  let value = _data[i];
  while (isRegularChar(value)) {
    result += String.fromCharCode(value);
    value = _data[++i];
  }

  return result.length > 1 
    ? {value: result, start, end: i - 1}
    : null;
} 
  
function parseStringAt(start, skipEmpty = true) {
  if (skipEmpty) {
    start = skipEmptyChars(start);
  }
  if (isOutside(start)) {
    return null;
  }

  let i = start;
  let result = "";
  let value = _data[i];
  while (isRegularChar(value)) {
    result += String.fromCharCode(value);
    value = _data[++i];
  }

  return result.length !== 0 
    ? {value: result, start, end: i - 1}
    : null;
} 
  
function parseBoolAt(start, skipEmpty = true)  {
  if (skipEmpty) {
    start = skipEmptyChars(start);
  }    

  if (isOutside(start)) {
    return null;
  }

  const nearestDelimiter = findDelimiterIndex(true, start);

  const isTrue = findSubarrayIndex(keywordCodes.TRUE, {
    minIndex: start, 
    maxIndex: nearestDelimiter === -1 ? _maxIndex : nearestDelimiter,
  });
  if (isTrue) {
    return {value: true, start, end: isTrue.end};
  }    
    
  const isFalse = findSubarrayIndex(keywordCodes.FALSE, {
    minIndex: start,      
    maxIndex: nearestDelimiter === -1 ? _maxIndex : nearestDelimiter,
  });
  if (isFalse) {
    return {value: false, start, end: isFalse.end};
  }

  return null;
} 
  
function parseNumberArrayAt(start, float = true, skipEmpty = true) {
  const arrayBounds = getArrayBoundsAt(start, skipEmpty);
  if (!arrayBounds) {
    return null;
  }

  const numbers = [];
  let current;
  let i = arrayBounds.start + 1;
  while(i < arrayBounds.end) {
    current = parseNumberAt(i, float, true);
    if (!current) {
      break;
    }
    numbers.push(current.value);
    i = current.end + 1;
  }

  return {value: numbers, start: arrayBounds.start, end: arrayBounds.end};
}  
  
function parseNameArrayAt(start, includeSlash = true, 
  skipEmpty = true) {
  const arrayBounds = getArrayBoundsAt(start, skipEmpty);
  if (!arrayBounds) {
    return null;
  }

  const names = [];
  let current;
  let i = arrayBounds.start + 1;
  while(i < arrayBounds.end) {
    current = parseNameAt(i, includeSlash, true);
    if (!current) {
      break;
    }
    names.push(current.value);
    i = current.end + 1;
  }

  return {value: names, start: arrayBounds.start, end: arrayBounds.end};
}  
  
function parseDictType(bounds) {
  return parseDictPropertyByName(keywordCodes.TYPE, bounds);   
} 
  
function parseDictSubtype(bounds) {
  return parseDictPropertyByName(keywordCodes.SUBTYPE, bounds);   
} 
  
function parseDictPropertyByName(propName, bounds) {
  const arr = _data;
  if (!propName?.length) {
    return null;
  }

  const minIndex = Math.max(Math.min(bounds.start ?? 0, _maxIndex), 0);
  const maxIndex = Math.max(Math.min(bounds.end ?? _maxIndex, _maxIndex), 0);

  let propNameBounds;
  let i = minIndex;
  let j;
  let code;
  let prevCode;
  let dictOpened = 0;
  let dictBound = true;
  let literalOpened = 0;
  outer_loop:
  for (i; i <= maxIndex; i++) {
    prevCode = code;
    code = arr[i];
      
    // check if literal opens
    if (code === codes.L_PARENTHESE
        && (!literalOpened || prevCode !== codes.BACKSLASH)) {
      // increase string literal nesting
      literalOpened++;
    }

    // check if literal closes
    if (code === codes.R_PARENTHESE
        && (literalOpened && prevCode !== codes.BACKSLASH)) {
      // decrease string literal nesting
      literalOpened--;
    }

    if (literalOpened) {
      // ignore all bytes while being inside a literal
      continue;
    }

    // check if dict opens or closes
    if (!dictBound) {
      if (code === codes.LESS && code === prevCode) {
        dictOpened++;
        dictBound = true;
      } else if (code === codes.GREATER && code === prevCode) {
        dictOpened--;
        dictBound = true;
      }
    } else {        
      dictBound = false;
    }

    // compare next j values to the corresponding values of the sought name
    for (j = 0; j < propName.length; j++) {
      if (arr[i + j] !== propName[j]) {
        continue outer_loop;
      }
    }

    if (dictOpened !== 1) {
      // the found property name is not inside the topmost dict
      continue;
    }

    // check if name is closed
    if (!isRegularChar(arr[i + j])) {
      propNameBounds = {start: i, end: i + j - 1};
      break;
    }
  }
    
  if (!propNameBounds) {
    // the property name is not found
    return null;
  }

  // parse the property value
  const type = parseNameAt(propNameBounds.end + 1);
  if (!type) {
    return null;
  }

  return type.value;     
} 
//#endregion 

//#region skip functions
function skipEmptyChars(start) {
  let index = findNonSpaceIndex(true, start);
  if (index === -1) {
    return -1;
  }
  if (_data[index] === codes.PERCENT) {
    // it's a comment. skip it
    const afterComment = findNewLineIndex(true, index + 1);
    if (afterComment === -1) {
      return -1;
    }
    index = findNonSpaceIndex(true, afterComment);
  }
  return index;
}

function skipToNextName(start, max) {
  start ||= 0;
  max = max 
    ? Math.min(max, _maxIndex)
    : 0;
  if (max < start) {
    return -1;
  }

  let i = start;
  while (i <= max) {      
    const value = getValueTypeAt(i, true);
    if (value) {
      let skipValueBounds;
      let parseResult;
      switch (value) {
      case valueTypes.DICTIONARY:
        skipValueBounds = getDictBoundsAt(i, false);
        break;
      case valueTypes.ARRAY:
        skipValueBounds = getArrayBoundsAt(i, false);
        break;
      case valueTypes.STRING_LITERAL:            
        skipValueBounds = getLiteralBoundsAt(i, false);
        break; 
      case valueTypes.STRING_HEX: 
        skipValueBounds = getHexBoundsAt(i, false);
        break; 
      case valueTypes.NUMBER:
        parseResult = parseNumberAt(i, true, false);
        if (parseResult) {
          skipValueBounds = parseResult;
        }
        break; 
      case valueTypes.BOOLEAN:
        parseResult = parseBoolAt(i, false);
        if (parseResult) {
          skipValueBounds = parseResult;
        }
        break;
      case valueTypes.COMMENT:
        // TODO: Add skip comment
        break;
      case valueTypes.NAME:
        return i;
      default:
        i++;
        continue;
      }   
      if (skipValueBounds) {
        i = skipValueBounds.end + 1;
        skipValueBounds = null;     
        continue;
      }
    }
    i++;
  }
  return -1;
}
//#endregion

//#region get chars/codes functions
function sliceCharCodes(start, end = undefined) {
  return _data.slice(start, (end || start) + 1);
}

function sliceChars(start, end = undefined) {
  return String.fromCharCode(..._data.slice(start, (end || start) + 1));
}

function getCharCode(index) {    
  return _data[index];
}  
//#endregion
`;
