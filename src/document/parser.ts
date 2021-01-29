import {  keywordCodes, DELIMITER_CHARS, SPACE_CHARS, DIGIT_CHARS, charCodes } from "./codes";
import { XRefType } from "./const";

export class Parser {
  private _data: Uint8Array;
  private _maxIndex: number;

  constructor(data: Uint8Array) {
    if (!data?.length) {
      throw new Error("Data is empty");
    }
    this._data = data;
    this._maxIndex = data.length - 1;
  }

  private static isRegularChar(code: number): boolean {
    return !DELIMITER_CHARS.has(code) && !SPACE_CHARS.has(code);
  }

  getPdfVersion(): string {
    let i = this.findSubarrayIndex(keywordCodes.VERSION);
    i += keywordCodes.VERSION.length;
    const version = this.parseNumberStartingAtIndex(i, true);

    return version.toFixed(1);
  }

  getXRefType(): XRefType {
    return 0;
  }

  /**
   * find the index of the first occurence of the subarray in the data
   * @param sub sought subarray
   * @param direction search direction
   * @param start starting index
   * @param closedOnly define if subarray must be followed by a delimiter in the search direction
   */
  private findSubarrayIndex(sub: number[] | readonly number[], 
    direction: "straight" | "reverse" = "straight", 
    start: number = undefined, closedOnly = false): number {
    const arr = this._data;

    if (!sub?.length) {
      return -1;
    }

    let i = this.getValidStartIndex(direction, start); 

    let j: number; 
    if (direction === "straight") { 
      outer_loop:
      for (i; i <= this._maxIndex; i++) {
        for (j = 0; j < sub.length; j++) {
          if (arr[i + j] !== sub[j]) {
            continue outer_loop;
          }
        }
        if (!closedOnly || !Parser.isRegularChar(arr[i + j + 1])) {
          return i;
        }
      }
    } else {
      const subMaxIndex = sub.length - 1;
      outer_loop:
      for (i; i >= 0; i--) {
        for (j = 0; j < sub.length; j++) {
          if (arr[i - j] !== sub[subMaxIndex - j]) {
            continue outer_loop;
          }
        }
        if (!closedOnly || !Parser.isRegularChar(arr[i - j - 1])) {
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
  private findDelimiterIndex(direction: "straight" | "reverse" = "straight", 
    start: number = undefined) {
    const arr = this._data;
    let i = this.getValidStartIndex(direction, start);    

    if (direction === "straight") {        
      for (i; i <= this._maxIndex; i++) {
        if (!Parser.isRegularChar(arr[i])) {
          return i;
        }
      }  
    } else {        
      for (i; i >= 0; i--) {
        if (!Parser.isRegularChar(arr[i])) {
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
  private findRegularIndex(direction: "straight" | "reverse" = "straight", 
    start: number = undefined) {
    const arr = this._data;
    let i = this.getValidStartIndex(direction, start); 
      
    if (direction === "straight") {        
      for (i; i <= this._maxIndex; i++) {
        if (Parser.isRegularChar(arr[i])) {
          return i;
        }
      }    
    } else {        
      for (i; i >= 0; i--) {
        if (Parser.isRegularChar(arr[i])) {
          return i;
        }
      }
    }
    
    return -1; 
  }

  private parseNumberStartingAtIndex(index: number, float = false) {
    let i = this.findRegularIndex("straight", index);

    let numberStr = "";
    let value = this._data[i];
    while (DIGIT_CHARS.has(value)
      || (float && value === charCodes.DOT)) {
      numberStr += String.fromCharCode(value);
      value = this._data[++i];
    }

    return +numberStr;
  }

  private getValidStartIndex(direction: "straight" | "reverse", start: number) {
    return !isNaN(start) 
      ? Math.max(Math.min(start, this._maxIndex), 0)
      : direction === "straight"
        ? 0
        : this._maxIndex;
  }
}
