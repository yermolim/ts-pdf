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
  
  /**check if index is outside of the underlying data byte array bounds */
  isOutside(index: number): boolean;

  /**chack if code at index is equal to the specified one */
  isCodeAtAsync(index: number, code: number): Promise<boolean>;

  /**
   * get a new parser instance which inner data array is a subarray of the source parser data
   * @param start subarray start index
   * @param end subarray end index (char at the end index is INCLUDED into the subarray)
   * @returns 
   */
  getSubParserAsync(start: number, end?: number): Promise<DataParser>;

  /**
   * get the type of the byte sequence starting at the index
   * @param start 
   * @param skipEmpty 
   * @returns 
   */
  getValueTypeAtAsync(start: number, skipEmpty?: boolean): Promise<ValueType>;

  //#region search methods

  /**
   * find the indices of the first occurence of the subarray in the data
   * @param sub sought subarray
   * @param direction search direction
   * @param start starting index
   * @param closedOnly define if subarray must be followed by a delimiter in the search direction
   */
  findSubarrayIndexAsync(sub: number[] | readonly number[], 
    options?: ParserOptions): Promise<ParserBounds>;

  /**
   * find the nearest specified char index
   * @param charCode sought char code
   * @param direction search direction
   * @param start starting index
   */
  findCharIndexAsync(charCode: number, direction?: boolean, 
    start?: number): Promise<number>;

  /**
   * find the nearest char index after or before EOL
   * @param direction search direction
   * @param start starting index
   */
  findNewLineIndexAsync(direction?: boolean, 
    start?: number): Promise<number>;
  
  /**
   * find the nearest space char index
   * @param direction search direction
   * @param start starting index
   */
  findSpaceIndexAsync(direction?: boolean, 
    start?: number): Promise<number>;

  /**
   * find the nearest non-space char index
   * @param direction search direction
   * @param start starting index
   */
  findNonSpaceIndexAsync(direction?: boolean, 
    start?: number): Promise<number>;
  
  /**
   * find the nearest delimiter char index
   * @param direction search direction
   * @param start starting index
   */
  findDelimiterIndexAsync(direction?: boolean, 
    start?: number): Promise<number>;
  
  /**
   * find the nearest non-delimiter char index
   * @param direction search direction
   * @param start starting index
   */
  findNonDelimiterIndexAsync(direction?: boolean, 
    start?: number): Promise<number>;

  /**
   * find the nearest regular (non-space and non-delimiter) char index
   * @param direction search direction
   * @param start starting index
   */
  findRegularIndexAsync(direction?: boolean, 
    start?: number): Promise<number>;

  /**
   * find the nearest space or delimiter char index
   * @param direction search direction
   * @param start starting index
   */
  findIrregularIndexAsync(direction?: boolean, 
    start?: number): Promise<number>;

  //#endregion

  //#region get bounds methods  
  
  getIndirectObjectBoundsAtAsync(start: number, skipEmpty?: boolean): Promise<ParserBounds>;
  
  getXrefTableBoundsAtAsync(start: number, skipEmpty?: boolean): Promise<ParserBounds>;

  getDictBoundsAtAsync(start: number, skipEmpty?: boolean): Promise<ParserBounds>;
  
  getArrayBoundsAtAsync(start: number, skipEmpty?: boolean): Promise<ParserBounds>;
      
  getHexBoundsAsync(start: number, skipEmpty?: boolean): Promise<ParserBounds>;

  getLiteralBoundsAsync(start: number, skipEmpty?: boolean): Promise<ParserBounds>;

  //#endregion

  //#region parse methods  

  parseNumberAtAsync(start: number, 
    float?: boolean, skipEmpty?: boolean): Promise<ParserResult<number>>;
  
  parseNameAtAsync(start: number, 
    includeSlash?: boolean, skipEmpty?: boolean): Promise<ParserResult<string>>;
  
  parseStringAtAsync(start: number, skipEmpty?: boolean): Promise<ParserResult<string>>;
  
  parseBoolAtAsync(start: number, skipEmpty?: boolean): Promise<ParserResult<boolean>>;
  
  parseNumberArrayAtAsync(start: number, float?: boolean, 
    skipEmpty?: boolean): Promise<ParserResult<number[]>>;
  
  parseNameArrayAtAsync(start: number, includeSlash?: boolean, 
    skipEmpty?: boolean): Promise<ParserResult<string[]>>;
  
  parseDictTypeAsync(bounds: ParserBounds): Promise<string>;
  
  parseDictSubtypeAsync(bounds: ParserBounds): Promise<string>;
  
  parseDictPropertyByNameAsync(propName: readonly number[] | number[], 
    bounds: ParserBounds): Promise<string>;

  //#endregion

  //#region skip methods

  /**
   * get the nearest non-space char index
   * @param start 
   * @returns first non-space char index (-1 if not found till the end of the data)
   */
  skipEmptyAsync(start: number): Promise<number>;

  /**
   * get the nearest PDF name index
   * @param start search start index
   * @param max search end index
   * @returns first PDF name index (-1 if not found till the end of the data)
   */
  skipToNextNameAsync(start: number, max: number): Promise<number>;

  //#endregion

  //#region get chars/codes methods

  /** slice the inner data array from the start index to the end index including BOTH ends */
  sliceCharCodesAsync(start: number, end?: number): Promise<Uint8Array>;

  /** 
   * slice the inner data array from the start index to the end index including BOTH ends 
   * and convert it to string
   */
  sliceCharsAsync(start: number, end?: number): Promise<string>;

  //#endregion
}
