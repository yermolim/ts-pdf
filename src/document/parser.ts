import { codes, keywordCodes, DELIMITER_CHARS, SPACE_CHARS, DIGIT_CHARS, 
  isRegularChar } from "./codes";
import { XRefType, xRefTypes } from "./const";
import { ObjInfo } from "./entities/core/obj-info";
import { XRef } from "./entities/x-refs/x-ref";

export type SearchDirection = "straight" | "reverse";

export interface SearchOptions {
  direction?: SearchDirection; 
  minIndex?: number;
  maxIndex?: number;
  closedOnly?: boolean;
}

export interface ParseResult<T> {
  value: T; 
  start: number;
  end: number;
}

export class Parser {
  private _data: Uint8Array;
  
  private _maxIndex: number;
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
    const version = this.parseNumberStartingAtIndex(i.end + 1, true)?.value;
    if (!version) {
      throw new Error("Error parsing version number");
    }

    return version.toFixed(1);
  }

  //#region search methods
  getValidStartIndex(direction: "straight" | "reverse", 
    start: number): number {
    return !isNaN(start) 
      ? Math.max(Math.min(start, this._maxIndex), 0)
      : direction === "straight"
        ? 0
        : this._maxIndex;
  }

  /**
   * find the indices of the first occurence of the subarray in the data
   * @param sub sought subarray
   * @param direction search direction
   * @param start starting index
   * @param closedOnly define if subarray must be followed by a delimiter in the search direction
   */
  findSubarrayIndex(sub: number[] | readonly number[], 
    options?: SearchOptions): {start: number; end: number} { 

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
   * find the nearest non-space char index
   * @param direction search direction
   * @param start starting index
   */
  findNonSpaceIndex(direction: "straight" | "reverse" = "straight", 
    start?: number): number {
    const arr = this._data;
    let i = this.getValidStartIndex(direction, start);    

    if (direction === "straight") {        
      for (i; i <= this._maxIndex; i++) {
        if (!SPACE_CHARS.has(arr[i])) {
          return i;
        }
      }  
    } else {        
      for (i; i >= 0; i--) {
        if (!SPACE_CHARS.has(arr[i])) {
          return i;
        }
      }
    }
  
    return -1; 
  }

  /**
   * find the nearest delimiter char index
   * @param direction search direction
   * @param start starting index
   */
  findDelimiterIndex(direction: "straight" | "reverse" = "straight", 
    start?: number): number {
    const arr = this._data;
    let i = this.getValidStartIndex(direction, start);    

    if (direction === "straight") {        
      for (i; i <= this._maxIndex; i++) {
        if (!isRegularChar(arr[i])) {
          return i;
        }
      }  
    } else {        
      for (i; i >= 0; i--) {
        if (!isRegularChar(arr[i])) {
          return i;
        }
      }
    }
  
    return -1;    
  }

  /**
   * find the nearest regular (non-delimiter) char index
   * @param direction search direction
   * @param start starting index
   */
  findRegularIndex(direction: "straight" | "reverse" = "straight", 
    start?: number): number {
    const arr = this._data;
    let i = this.getValidStartIndex(direction, start); 
      
    if (direction === "straight") {        
      for (i; i <= this._maxIndex; i++) {
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
  //#endregion

  //#region parse methods
  parseNumberStartingAtIndex(index: number, 
    float = false, skipEmpty = true): ParseResult<number>  {
    const start = skipEmpty
      ? this.findRegularIndex("straight", index)
      : index;
    if (start < 0 || start > this._maxIndex) {
      return null;
    }

    let i = start;
    let numberStr = "";
    let value = this._data[i];
    while (DIGIT_CHARS.has(value)
      || (float && value === codes.DOT)) {
      numberStr += String.fromCharCode(value);
      value = this._data[++i];
    };

    return numberStr 
      ? {value: +numberStr, start, end: i - 1}
      : null;
  }
  //#endregion
}
