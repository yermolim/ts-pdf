import { ValueType } from "../spec-constants";

export interface ParserOptions {
  /**'true' - straight, 'false' - reverse */
  direction?: boolean; 
  /**search start index, inclusive */
  minIndex?: number;
  /**search end index, inclusive */
  maxIndex?: number;
  /**search only for the sequences that are followed with a PDF delimiter char */
  closedOnly?: boolean;
}

/**indices of the PDF object parsing bounds in the byte array of the corresponding DataParser */
export interface ParserBounds {  
  start: number;
  end: number;
  contentStart?: number;
  contentEnd?: number;
}

export interface ParserResult<T> extends ParserBounds {
  value: T; 
}

/**PDF data parser */
export interface DataParser {
  /**the last index in the underlying data byte array */
  get maxIndex(): number;

  destroy(): void;

  /**
   * get a new parser instance which inner data array is a subarray of the source parser data
   * @param start subarray start index
   * @param end subarray end index (char at the end index is INCLUDED into the subarray)
   * @returns 
   */
  getSubParser(start: number, end?: number): DataParser;
  
  /**check if index is outside of the underlying data byte array bounds */
  isOutside(index: number): boolean;

  /**
   * get the type of the byte sequence starting at the index
   * @param start 
   * @param skipEmpty 
   * @returns 
   */
  getValueTypeAt(start: number, skipEmpty?: boolean): ValueType;

  //#region search methods

  /**
   * find the indices of the first occurence of the subarray in the data
   * @param sub sought subarray
   * @param direction search direction
   * @param start starting index
   * @param closedOnly define if subarray must be followed by a delimiter in the search direction
   */
  findSubarrayIndex(sub: number[] | readonly number[], 
    options?: ParserOptions): ParserBounds;

  /**
   * find the nearest specified char index
   * @param charCode sought char code
   * @param direction search direction
   * @param start starting index
   */
  findCharIndex(charCode: number, direction?: boolean, 
    start?: number): number;

  /**
   * find the nearest char index after or before EOL
   * @param direction search direction
   * @param start starting index
   */
  findNewLineIndex(direction?: boolean, 
    start?: number): number;
  
  /**
   * find the nearest space char index
   * @param direction search direction
   * @param start starting index
   */
  findSpaceIndex(direction?: boolean, 
    start?: number): number;

  /**
   * find the nearest non-space char index
   * @param direction search direction
   * @param start starting index
   */
  findNonSpaceIndex(direction?: boolean, 
    start?: number): number;
  
  /**
   * find the nearest delimiter char index
   * @param direction search direction
   * @param start starting index
   */
  findDelimiterIndex(direction?: boolean, 
    start?: number): number;
  
  /**
   * find the nearest non-delimiter char index
   * @param direction search direction
   * @param start starting index
   */
  findNonDelimiterIndex(direction?: boolean, 
    start?: number): number;

  /**
   * find the nearest regular (non-space and non-delimiter) char index
   * @param direction search direction
   * @param start starting index
   */
  findRegularIndex(direction?: boolean, 
    start?: number): number;

  /**
   * find the nearest space or delimiter char index
   * @param direction search direction
   * @param start starting index
   */
  findIrregularIndex(direction?: boolean, 
    start?: number): number;

  //#endregion

  //#region get bounds methods  
  
  getIndirectObjectBoundsAt(start: number, skipEmpty?: boolean): ParserBounds;
  
  getXrefTableBoundsAt(start: number, skipEmpty?: boolean): ParserBounds;

  getDictBoundsAt(start: number, skipEmpty?: boolean): ParserBounds;
  
  getArrayBoundsAt(start: number, skipEmpty?: boolean): ParserBounds;
      
  getHexBounds(start: number, skipEmpty?: boolean): ParserBounds;

  getLiteralBounds(start: number, skipEmpty?: boolean): ParserBounds;

  //#endregion

  //#region parse methods  

  parseNumberAt(start: number, 
    float?: boolean, skipEmpty?: boolean): ParserResult<number>;
  
  parseNameAt(start: number, 
    includeSlash?: boolean, skipEmpty?: boolean): ParserResult<string>;
  
  parseStringAt(start: number, skipEmpty?: boolean): ParserResult<string>;
  
  parseBoolAt(start: number, skipEmpty?: boolean): ParserResult<boolean>;
  
  parseNumberArrayAt(start: number, float?: boolean, 
    skipEmpty?: boolean): ParserResult<number[]>;
  
  parseNameArrayAt(start: number, includeSlash?: boolean, 
    skipEmpty?: boolean): ParserResult<string[]>;
  
  parseDictType(bounds: ParserBounds): string;
  
  parseDictSubtype(bounds: ParserBounds): string;
  
  parseDictPropertyByName(propName: readonly number[] | number[], bounds: ParserBounds): string;

  //#endregion

  //#region skip methods

  /**
   * get the nearest non-space char index
   * @param start 
   * @returns first non-space char index (-1 if not found till the end of the data)
   */
  skipEmpty(start: number): number;

  /**
   * get the nearest PDF name index
   * @param start search start index
   * @param max search end index
   * @returns first PDF name index (-1 if not found till the end of the data)
   */
  skipToNextName(start: number, max: number): number;

  //#endregion

  //#region get chars/codes methods

  getCharCode(index: number): number;

  getChar(index: number): string;

  /** slice the inner data array from the start index to the end index including BOTH ends */
  sliceCharCodes(start: number, end?: number): Uint8Array;

  /** 
   * slice the inner data array from the start index to the end index including BOTH ends 
   * and convert it to string
   */
  sliceChars(start: number, end?: number): string;
}
