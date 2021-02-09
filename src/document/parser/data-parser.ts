import { codes, keywordCodes, 
  DELIMITER_CHARS, SPACE_CHARS, DIGIT_CHARS, 
  isRegularChar } from "../common/codes";
import { ObjectType, ValueType, valueTypes } from "../common/const";

export type SearchDirection = "straight" | "reverse";

export interface SearchOptions {
  direction?: SearchDirection; 
  minIndex?: number;
  maxIndex?: number;
  closedOnly?: boolean;
}

export interface Bounds {  
  start: number;
  end: number;
  contentStart?: number;
  contentEnd?: number;
}

export interface ParseInfo {
  parser: DataParser;
  bounds: Bounds;
  type?: ObjectType;
  value?: any;
  objectId?: number;
  /** parent object stream id */
  streamId?: number;
  parseInfoGetter?: (id: number) => ParseInfo;
}

export interface ParseResult<T> extends Bounds {
  value: T; 
}

export class DataParser {
  private readonly _data: Uint8Array;  
  private readonly _maxIndex: number;

  public get maxIndex(): number {
    return this._maxIndex;
  }

  constructor(data: Uint8Array) {
    if (!data?.length) {
      throw new Error("Data is empty");
    }
    this._data = data;
    this._maxIndex = data.length - 1;
  }

  getPdfVersion(): string {
    const i = this.findSubarrayIndex(keywordCodes.VERSION);
    if (!i) {
      throw new Error("PDF not valid. Version not found");
    }
    const version = this.parseNumberAt(i.end + 1, true)?.value;
    if (!version) {
      throw new Error("Error parsing version number");
    }

    return version.toFixed(1);
  }
  
  getLastXrefIndex(): ParseResult<number> {
    const xrefStartIndex = this.findSubarrayIndex(keywordCodes.XREF_START, 
      {maxIndex: this.maxIndex, direction: "reverse"});
    if (!xrefStartIndex) {
      return null;
    }

    const xrefIndex = this.parseNumberAt(xrefStartIndex.end + 1);
    if (!xrefIndex) {
      return null;
    }

    return xrefIndex;
  }

  //#region search methods
  /**
   * find the indices of the first occurence of the subarray in the data
   * @param sub sought subarray
   * @param direction search direction
   * @param start starting index
   * @param closedOnly define if subarray must be followed by a delimiter in the search direction
   */
  findSubarrayIndex(sub: number[] | readonly number[], 
    options?: SearchOptions): Bounds { 

    const arr = this._data;
    if (!sub?.length) {
      return null;
    }

    const direction = options?.direction || "straight";
    const minIndex = Math.max(Math.min(options?.minIndex ?? 0, this._maxIndex), 0);
    const maxIndex = Math.max(Math.min(options?.maxIndex ?? this._maxIndex, this._maxIndex), 0);
    const allowOpened = !options?.closedOnly;

    let i = direction === "straight"
      ? minIndex
      : maxIndex; 

    let j: number; 
    if (direction === "straight") { 
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
  
  /**
   * find the nearest specified char index
   * @param charCode sought char code
   * @param direction search direction
   * @param start starting index
   */
  findCharIndex(charCode: number, direction: "straight" | "reverse" = "straight", 
    start?: number): number {
    
    return this.findSingleCharIndex((value) => charCode === value,
      direction, start);  
  }
  
  /**
   * find the nearest char index after or before EOL
   * @param direction search direction
   * @param start starting index
   */
  findNewLineIndex(direction: "straight" | "reverse" = "straight", 
    start?: number): number {

    let lineBreakIndex = this.findSingleCharIndex(
      (value) => value === codes.CARRIAGE_RETURN || value === codes.LINE_FEED,
      direction, start); 
      
    if (lineBreakIndex === -1) {
      return -1;
    }

    if (direction === "straight") {  
      if (this._data[lineBreakIndex] === codes.CARRIAGE_RETURN 
        && this._data[lineBreakIndex + 1] === codes.LINE_FEED) {
        lineBreakIndex++;
      }  
      return Math.min(lineBreakIndex + 1, this._maxIndex);
    } else {        
      if (this._data[lineBreakIndex] === codes.LINE_FEED 
        && this._data[lineBreakIndex - 1] === codes.CARRIAGE_RETURN) {
        lineBreakIndex--;
      }  
      return Math.max(lineBreakIndex - 1, 0);
    }
  }
  
  /**
   * find the nearest space char index
   * @param direction search direction
   * @param start starting index
   */
  findSpaceIndex(direction: "straight" | "reverse" = "straight", 
    start?: number): number {
    
    return this.findSingleCharIndex((value) => SPACE_CHARS.has(value),
      direction, start);  
  }

  /**
   * find the nearest non-space char index
   * @param direction search direction
   * @param start starting index
   */
  findNonSpaceIndex(direction: "straight" | "reverse" = "straight", 
    start?: number): number {    
    
    return this.findSingleCharIndex((value) => !SPACE_CHARS.has(value),
      direction, start);  
  }
  
  /**
   * find the nearest delimiter char index
   * @param direction search direction
   * @param start starting index
   */
  findDelimiterIndex(direction: "straight" | "reverse" = "straight", 
    start?: number): number {
    
    return this.findSingleCharIndex((value) => DELIMITER_CHARS.has(value),
      direction, start);  
  }
  
  /**
   * find the nearest non-delimiter char index
   * @param direction search direction
   * @param start starting index
   */
  findNonDelimiterIndex(direction: "straight" | "reverse" = "straight", 
    start?: number): number {
    
    return this.findSingleCharIndex((value) => !DELIMITER_CHARS.has(value),
      direction, start);  
  }

  /**
   * find the nearest space or delimiter char index
   * @param direction search direction
   * @param start starting index
   */
  findIrregularIndex(direction: "straight" | "reverse" = "straight", 
    start?: number): number {
    
    return this.findSingleCharIndex((value) => !isRegularChar(value),
      direction, start);  
  }

  /**
   * find the nearest regular (non-space and non-delimiter) char index
   * @param direction search direction
   * @param start starting index
   */
  findRegularIndex(direction: "straight" | "reverse" = "straight", 
    start?: number): number {

    return this.findSingleCharIndex((value) => isRegularChar(value),
      direction, start);
  }
  //#endregion

  //#region parse methods  
  getValueTypeAt(start: number, skipEmpty = true): ValueType  {
    if (skipEmpty) {
      start = this.skipEmpty(start);
    }
    if (this.isOutside(start)) {
      return null;
    }

    const arr = this._data;
    const i = start;
    const charCode = arr[i];
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
        const nextDelimIndex = this.findDelimiterIndex("straight", i + 1);
        if (nextDelimIndex !== -1) {
          const refEndIndex = this.findCharIndex(codes.R, "reverse", nextDelimIndex - 1);
          if (refEndIndex !== -1 && refEndIndex > i) {
            return valueTypes.REF;
          }
        }
        return valueTypes.NUMBER;
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
  
  getIndirectObjectBoundsAt(start: number, skipEmpty = true): Bounds {   
    if (skipEmpty) {
      start = this.skipEmpty(start);
    }
    if (this.isOutside(start)) {
      return null;
    }    

    const objStartIndex = this.findSubarrayIndex(keywordCodes.OBJ, 
      {minIndex: start, closedOnly: true});
    if (!objStartIndex) {
      return null;
    }      

    let contentStart = this.findNonSpaceIndex("straight", objStartIndex.end + 1);
    if (contentStart === -1){
      return null;
    }    
    const objEndIndex = this.findSubarrayIndex(keywordCodes.OBJ_END, 
      {minIndex: contentStart, closedOnly: true});
    if (!objEndIndex) {
      return null;
    }
    let contentEnd = this.findNonSpaceIndex("reverse", objEndIndex.start - 1);

    if (this.getCharCode(contentStart) === codes.LESS
      && this.getCharCode(contentStart + 1) === codes.LESS
      && this.getCharCode(contentEnd - 1) === codes.GREATER
      && this.getCharCode(contentEnd) === codes.GREATER) {
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
  
  getXrefTableBoundsAt(start: number, skipEmpty = true): Bounds {   
    if (skipEmpty) {
      start = this.skipEmpty(start);
    }
    if (this.isOutside(start) || this._data[start] !== codes.x) {
      return null;
    }

    const xrefStart = this.findSubarrayIndex(keywordCodes.XREF_TABLE, 
      {minIndex: start});
    if (!xrefStart) {
      return null;
    }     
    const contentStart = this.findNonSpaceIndex("straight", xrefStart.end + 1);
    if (contentStart === -1){
      return null;
    }   
    const xrefEnd = this.findSubarrayIndex(keywordCodes.TRAILER, 
      {minIndex: xrefStart.end + 1});
    if (!xrefEnd) {
      return null;
    } 
    const contentEnd = this.findNonSpaceIndex("reverse", xrefEnd.start - 1);

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

  getDictBoundsAt(start: number, skipEmpty = true): Bounds {   
    if (skipEmpty) {
      start = this.skipEmpty(start);
    }
    if (this.isOutside(start) 
      || this._data[start] !== codes.LESS
      || this._data[start + 1] !== codes.LESS) {
      return null;
    }
     
    const contentStart = this.findNonSpaceIndex("straight", start + 2);
    if (contentStart === -1){
      return null;
    }  
    
    let dictOpened = 1;
    let dictBound = true;
    let literalOpened = 0;
    let i = contentStart;    
    let code: number;
    let prevCode: number;
    while (dictOpened) {
      prevCode = code;
      code = this._data[i++];

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
 
    const contentEnd = this.findNonSpaceIndex("reverse", end - 2);
    if (contentEnd < contentStart) {
      // should be possible only in an empty dict
      return null;
    }

    return {
      start, 
      end,
      contentStart,
      contentEnd,
    };
  }
  
  getArrayBoundsAt(start: number, skipEmpty = true): Bounds {
    if (skipEmpty) {
      start = this.skipEmpty(start);
    }
    if (this.isOutside(start) || this._data[start] !== codes.L_BRACKET) {
      return null;
    }

    let subArrayOpened = 0;
    let i = start + 1;    
    let code: number;
    while (subArrayOpened || code !== codes.R_BRACKET) {
      code = this._data[i++];
      if (code === codes.L_BRACKET) {
        subArrayOpened++;
      } else if (subArrayOpened && code === codes.R_BRACKET) {
        subArrayOpened--;
      }
    }
    const arrayEnd = i - 1;
    if (arrayEnd - start < 2) {
      return null;
    }

    return {start, end: arrayEnd};
  }
      
  getHexBounds(start: number, skipEmpty = true): Bounds  {   
    if (skipEmpty) {
      start = this.skipEmpty(start);
    }
    if (this.isOutside(start) || this.getCharCode(start) !== codes.LESS) {
      return null;
    }

    const end = this.findCharIndex(codes.GREATER, "straight", start + 1);
    if (end === -1) {
      return null;
    }

    return {start, end};
  }  

  getLiteralBounds(start: number, skipEmpty = true): Bounds  {       
    if (skipEmpty) {
      start = this.skipEmpty(start);
    }
    if (this.isOutside(start) || this.getCharCode(start) !== codes.L_PARENTHESE) {
      return null;
    }

    let i = start + 1;
    let prevCode: number;
    let code: number;
    let opened = 0;

    while (opened || code !== codes.R_PARENTHESE || prevCode === codes.BACKSLASH) {
      if (i > this._maxIndex) {
        return null;
      }

      if (!isNaN(code)) {
        prevCode = code;
      }

      code = this.getCharCode(i++);

      if (prevCode !== codes.BACKSLASH) {
        if (code === codes.L_PARENTHESE) {
          opened += 1;
        } else if (opened && code === codes.R_PARENTHESE) {
          opened -= 1;
        }
      }
    }

    return {start, end: i - 1};
  }

  parseNumberAt(start: number, 
    float = false, skipEmpty = true): ParseResult<number>  {
    if (skipEmpty) {
      start = this.skipEmpty(start);
    }
    if (this.isOutside(start) || !isRegularChar(this._data[start])) {
      return null;
    }

    let i = start;
    let numberStr = "";
    let value = this._data[i];
    if (value === codes.MINUS) {
      numberStr += value;
      value = this._data[++i];
    }
    while (DIGIT_CHARS.has(value)
      || (float && value === codes.DOT)) {
      numberStr += String.fromCharCode(value);
      value = this._data[++i];
    };

    return numberStr 
      ? {value: +numberStr, start, end: i - 1}
      : null;
  }
  
  parseNameAt(start: number, 
    includeSlash = true, skipEmpty = true): ParseResult<string>  {
    if (skipEmpty) {
      start = this.skipEmpty(start);
    }
    if (this.isOutside(start) || this._data[start] !== codes.SLASH) {
      return null;
    }

    let i = start + 1;
    let result = includeSlash
      ? "/"
      : "";
    let value = this._data[i];
    while (isRegularChar(value)) {
      result += String.fromCharCode(value);
      value = this._data[++i];
    };

    return result.length > 1 
      ? {value: result, start, end: i - 1}
      : null;
  } 
  
  parseBoolAt(start: number, skipEmpty = true): ParseResult<boolean>  {
    if (skipEmpty) {
      start = this.skipEmpty(start);
    }
    if (this.isOutside(start)) {
      return null;
    }

    const isTrue = this.findSubarrayIndex(keywordCodes.TRUE, {minIndex: start});
    if (isTrue) {
      return {value: true, start, end: isTrue.end};
    }
    
    const isFalse = this.findSubarrayIndex(keywordCodes.FALSE, {minIndex: start});
    if (isFalse) {
      return {value: true, start, end: isFalse.end};
    }

    return null;
  } 
  
  parseNumberArrayAt(start: number, float = true, 
    skipEmpty = true): ParseResult<number[]>  {
    const arrayBounds = this.getArrayBoundsAt(start, skipEmpty);
    if (!arrayBounds) {
      return null;
    }

    const numbers: number[] = [];
    let current: ParseResult<number>;
    let i = arrayBounds.start + 1;
    while(i < arrayBounds.end) {
      current = this.parseNumberAt(i, float, true);
      if (!current) {
        break;
      }
      numbers.push(current.value);
      i = current.end + 1;
    }

    return {value: numbers, start: arrayBounds.start, end: arrayBounds.end};
  }  
  
  parseNameArrayAt(start: number, includeSlash = true, 
    skipEmpty = true): ParseResult<string[]>  {
    const arrayBounds = this.getArrayBoundsAt(start, skipEmpty);
    if (!arrayBounds) {
      return null;
    }

    const names: string[] = [];
    let current: ParseResult<string>;
    let i = arrayBounds.start + 1;
    while(i < arrayBounds.end) {
      current = this.parseNameAt(i, includeSlash, true);
      if (!current) {
        break;
      }
      names.push(current.value);
      i = current.end + 1;
    }

    return {value: names, start: arrayBounds.start, end: arrayBounds.end};
  }  
  
  parseDictType(bounds: Bounds): string  {
    return this.parseDictNameProperty(keywordCodes.TYPE, bounds);   
  } 
  
  parseDictSubtype(bounds: Bounds): string {
    return this.parseDictNameProperty(keywordCodes.SUBTYPE, bounds);   
  } 
  
  parseDictNameProperty(subarray: readonly number[] | number[], bounds: Bounds): string {
    const typeProp = this.findSubarrayIndex(subarray, 
      {minIndex: bounds.start, maxIndex: bounds.end});
    if (!typeProp) {
      return null;
    }

    const type = this.parseNameAt(typeProp.end + 1);
    if (!type) {
      return null;
    }

    return type.value;    
  } 
  //#endregion

  //#region skip methods
  skipEmpty(start: number): number {
    let index = this.findNonSpaceIndex("straight", start);
    if (index === -1) {
      return -1;
    }
    if (this._data[index] === codes.PERCENT) {
      // it's a comment. skip it
      const afterComment = this.findNewLineIndex("straight", index + 1);
      if (afterComment === -1) {
        return -1;
      }
      index = this.findNonSpaceIndex("straight", afterComment);
    }
    return index;
  }

  skipToNextName(start: number, max: number): number {
    start ||= 0;
    max = max 
      ? Math.min(max, this._maxIndex)
      : 0;
    if (max < start) {
      return -1;
    }

    let i = start;
    while (i <= max) {      
      const value = this.getValueTypeAt(i, true);
      if (value) {
        let skipValueBounds: Bounds;
        switch (value) {
          case valueTypes.DICTIONARY:
            skipValueBounds = this.getDictBoundsAt(i, false);
            break;
          case valueTypes.ARRAY:
            skipValueBounds = this.getArrayBoundsAt(i, false);
            break;
          case valueTypes.STRING_LITERAL:            
            skipValueBounds = this.getLiteralBounds(i, false);
            break; 
          case valueTypes.STRING_HEX: 
            skipValueBounds = this.getHexBounds(i, false);
            break; 
          case valueTypes.NUMBER:
            const numberParseResult = this.parseNumberAt(i, true, false);
            if (numberParseResult) {
              skipValueBounds = numberParseResult;
            }
            break; 
          case valueTypes.BOOLEAN:
            const boolParseResult = this.parseBoolAt(i, false);
            if (boolParseResult) {
              skipValueBounds = boolParseResult;
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

    // naive logic
    // for (let i = start; i <= max; i++) {
    //   // TODO: add a check if slash is inside a literal string
    //   if (this._data[i] === codes.SLASH) {
    //     return i;
    //   }
    // }
    return -1;
  }
  //#endregion

  //#region get chars/codes methods
  getCharCode(index: number): number {    
    return this._data[index];
  }

  getChar(index: number): string {    
    const code = this._data[index];
    if (!isNaN(code)) {
      return String.fromCharCode(code);
    }
    return null;
  }

  /** slice the inner data array from the start index to the end index including BOTH ends */
  sliceCharCodes(start: number, end?: number): Uint8Array {
    return this._data.slice(start, (end || start) + 1);
  }

  /** 
   * slice the inner data array from the start index to the end index including BOTH ends 
   * and convert it to string
   */
  sliceChars(start: number, end?: number): string {
    return String.fromCharCode(...this._data.slice(start, (end || start) + 1));
  }
  
  /** returns a SUBARRAY of the inner data array 
   * from the start index to the end index including BOTH ends */
  subCharCodes(start: number, end?: number): Uint8Array {
    return this._data.subarray(start, (end || start) + 1);
  }
  //#endregion
  
  isOutside(index: number) {
    return (index < 0 || index > this._maxIndex);
  }

  //#region private search methods
  private getValidStartIndex(direction: "straight" | "reverse", 
    start: number): number {
    return !isNaN(start) 
      ? Math.max(Math.min(start, this._maxIndex), 0)
      : direction === "straight"
        ? 0
        : this._maxIndex;
  }
  
  private findSingleCharIndex(filter: (value: number) => boolean, 
    direction: "straight" | "reverse" = "straight", start?: number): number {

    const arr = this._data;
    let i = this.getValidStartIndex(direction, start); 
      
    if (direction === "straight") {        
      for (i; i <= this._maxIndex; i++) {
        if (filter(arr[i])) {
          return i;
        }
      }    
    } else {        
      for (i; i >= 0; i--) {
        if (filter(arr[i])) {
          return i;
        }
      }
    }
    
    return -1; 
  }
  //#endregion
}
