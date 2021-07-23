import { DataParser, ParserBounds, ParserOptions, ParserResult } 
  from "./data-parser";
import { ValueType } from "../spec-constants";
import { workerSrc } from "./bg-data-parser-worker-src";
import { UUID } from "ts-viewers-core";

export class BgDataParser implements DataParser {
  private static _workerSrc: string;
  private static _workerSrcPromise: Promise<string>;

  private readonly _data: Uint8Array;  
  private readonly _maxIndex: number;
  public get maxIndex(): number {
    return this._maxIndex;
  }

  private _worker: Worker;  

  private constructor(data: Uint8Array) {
    if (!data?.length) {
      throw new Error("Data is empty");
    }
    this._data = data;
    this._maxIndex = data.length - 1;
  }

  static async TryGetParser(data: Uint8Array): Promise<BgDataParser> {
    const worker = new BgDataParser(data.slice());
    try {
      await worker.initAsync();
      return worker;
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }

  destroy() {
    this._worker?.terminate();
  }
  
  /**
   * get a new parser instance which inner data array is a slice of the source parser data
   * @param start slice start index
   * @param end slice end index (char at the end index is INCLUDED into the slice)
   * @returns 
   */
  async getSubParserAsync(start: number, end?: number): Promise<DataParser> {
    const data = await this.execCommandAsync<Uint8Array>("slice-char-codes", [start, end]);
    const parser = await BgDataParser.TryGetParser(data);
    return parser;
  }
  
  isOutside(index: number): boolean {
    return (index < 0 || index > this._maxIndex);
  }

  async isCodeAtAsync(index: number, code: number): Promise<boolean> {
    const result = await this.execCommandAsync<boolean>("is-code-at", [index, code]);
    return result;
  }

  async getValueTypeAtAsync(start: number, skipEmpty = true): Promise<ValueType>  {
    const result = await this.execCommandAsync<ValueType>("get-value-type-at", [start, skipEmpty]);
    return result;
  } 

  //#region search methods

  async findSubarrayIndexAsync(sub: number[] | readonly number[], 
    options?: ParserOptions): Promise<ParserBounds> {
    const result = await this.execCommandAsync<ParserBounds>("find-subarray-index", [sub, options]);
    return result;
  }

  async findCharIndexAsync(charCode: number, direction = true, 
    start?: number): Promise<number> {    
    const result = await this.execCommandAsync<number>(
      "find-char-index", [charCode, direction, start]);
    return result; 
  }

  async findNewLineIndexAsync(direction = true, 
    start?: number): Promise<number> {
    const result = await this.execCommandAsync<number>(
      "find-new-line-index", [direction, start]);
    return result; 
  }
  
  async findSpaceIndexAsync(direction = true, 
    start?: number): Promise<number> {
    const result = await this.execCommandAsync<number>(
      "find-space-index", [direction, start]);
    return result; 
  }

  async findNonSpaceIndexAsync(direction = true, 
    start?: number): Promise<number> {
    const result = await this.execCommandAsync<number>(
      "find-non-space-index", [direction, start]);
    return result; 
  }
  
  async findDelimiterIndexAsync(direction = true, 
    start?: number): Promise<number> {
    const result = await this.execCommandAsync<number>(
      "find-delimiter-index", [direction, start]);
    return result; 
  }
  
  async findNonDelimiterIndexAsync(direction = true, 
    start?: number): Promise<number> {
    const result = await this.execCommandAsync<number>(
      "find-non-delimiter-index", [direction, start]);
    return result; 
  }

  async findRegularIndexAsync(direction = true, 
    start?: number): Promise<number> {
    const result = await this.execCommandAsync<number>(
      "find-regular-index", [direction, start]);
    return result; 
  }

  async findIrregularIndexAsync(direction = true, 
    start?: number): Promise<number> {
    const result = await this.execCommandAsync<number>(
      "find-irregular-index", [direction, start]);
    return result; 
  }

  //#endregion

  //#region get bounds methods  
  
  async getIndirectObjectBoundsAtAsync(start: number, skipEmpty = true): Promise<ParserBounds> {
    const result = await this.execCommandAsync<ParserBounds>(
      "get-indirect-object-bounds", [start, skipEmpty]);
    return result; 
  } 
  
  async getXrefTableBoundsAtAsync(start: number, skipEmpty = true): Promise<ParserBounds> {
    const result = await this.execCommandAsync<ParserBounds>(
      "get-xref-table-bounds", [start, skipEmpty]);
    return result; 
  }

  async getDictBoundsAtAsync(start: number, skipEmpty = true): Promise<ParserBounds> {
    const result = await this.execCommandAsync<ParserBounds>(
      "get-dict-bounds", [start, skipEmpty]);
    return result; 
  }
  
  async getArrayBoundsAtAsync(start: number, skipEmpty = true): Promise<ParserBounds> {
    const result = await this.execCommandAsync<ParserBounds>(
      "get-array-bounds", [start, skipEmpty]);
    return result; 
  }
      
  async getHexBoundsAtAsync(start: number, skipEmpty = true): Promise<ParserBounds> {
    const result = await this.execCommandAsync<ParserBounds>(
      "get-hex-bounds", [start, skipEmpty]);
    return result; 
  }  

  async getLiteralBoundsAtAsync(start: number, skipEmpty = true): Promise<ParserBounds> {
    const result = await this.execCommandAsync<ParserBounds>(
      "get-literal-bounds", [start, skipEmpty]);
    return result; 
  }

  //#endregion

  //#region parse methods  

  async parseNumberAtAsync(start: number, 
    float = false, skipEmpty = true): Promise<ParserResult<number>> {
    const result = await this.execCommandAsync<ParserResult<number>>(
      "parse-number", [start, float, skipEmpty]);
    return result; 
  }
  
  async parseNameAtAsync(start: number, 
    includeSlash = true, skipEmpty = true): Promise<ParserResult<string>> {
    const result = await this.execCommandAsync<ParserResult<string>>(
      "parse-name", [start, includeSlash, skipEmpty]);
    return result; 
  } 
  
  async parseStringAtAsync(start: number, skipEmpty = true): Promise<ParserResult<string>> {
    const result = await this.execCommandAsync<ParserResult<string>>(
      "parse-string", [start, skipEmpty]);
    return result; 
  } 
  
  async parseBoolAtAsync(start: number, skipEmpty = true): Promise<ParserResult<boolean>>  {
    const result = await this.execCommandAsync<ParserResult<boolean>>(
      "parse-bool", [start, skipEmpty]);
    return result; 
  } 
  
  async parseNumberArrayAtAsync(start: number, float = true, 
    skipEmpty = true): Promise<ParserResult<number[]>> {
    const result = await this.execCommandAsync<ParserResult<number[]>>(
      "parse-number-array", [start, float, skipEmpty]);
    return result; 
  }  
  
  async parseNameArrayAtAsync(start: number, includeSlash = true, 
    skipEmpty = true): Promise<ParserResult<string[]>> {
    const result = await this.execCommandAsync<ParserResult<string[]>>(
      "parse-name-array", [start, includeSlash, skipEmpty]);
    return result; 
  }  
  
  async parseDictTypeAsync(bounds: ParserBounds): Promise<string> {
    const result = await this.execCommandAsync<string>(
      "parse-dict-type", [bounds]);
    return result; 
  } 
  
  async parseDictSubtypeAsync(bounds: ParserBounds): Promise<string> { 
    const result = await this.execCommandAsync<string>(
      "parse-dict-subtype", [bounds]);
    return result; 
  } 
  
  async parseDictPropertyByNameAsync(propName: readonly number[] | number[], 
    bounds: ParserBounds): Promise<string> {
    const result = await this.execCommandAsync<string>(
      "parse-dict-property-by-name", [propName, bounds]);
    return result;   
  } 

  //#endregion
  
  //#region skip methods

  async skipEmptyAsync(start: number): Promise<number> {
    const result = await this.execCommandAsync<number>(
      "skip-empty", [start]);
    return result;   
  }

  async skipToNextNameAsync(start: number, max: number): Promise<number> {
    const result = await this.execCommandAsync<number>(
      "skip-to-next-name", [start, max]);
    return result;   
  }

  //#endregion

  //#region get chars/codes methods

  async sliceCharCodesAsync(start: number, end?: number): Promise<Uint8Array> {
    const result = await this.execCommandAsync<Uint8Array>(
      "slice-char-codes", [start, end]);
    return result;   
  }

  async sliceCharsAsync(start: number, end?: number): Promise<string> {
    const result = await this.execCommandAsync<string>(
      "slice-chars", [start, end]);
    return result; 
  }
  
  //#endregion

  private async initAsync() {
    // lazy load worker text url
    let src: string;
    if (!BgDataParser._workerSrc) {
      if (!BgDataParser._workerSrcPromise) {
        BgDataParser._workerSrcPromise = new Promise<string>((resolve, reject) => {
          const srcBlob = new Blob([workerSrc], { type: "text/plain" });
          const srcUri = URL.createObjectURL(srcBlob);
          BgDataParser._workerSrc = srcUri;
          resolve(BgDataParser._workerSrc);
        });
      }
      src = await BgDataParser._workerSrcPromise;
    } else {
      src = BgDataParser._workerSrc;
    }

    const dataBuffer = this._data.buffer;
    const worker = new Worker(src);
    const workerPromise = new Promise<void>((resolve, reject) => {
      worker.onmessage = (e) => {
        if (e.data.type === "success") {
          this._worker = worker;
          resolve();
        } else {
          reject(e);
        }
      };
      worker.onerror = (e) => reject(e);
      worker.postMessage({name: "init", bytes: dataBuffer}, [dataBuffer]);
    });
    await workerPromise;
  }

  private async execCommandAsync<T>(commandName: string, commandArgs: any[] = []): Promise<T> {
    if (!this._worker) {
      throw new Error("Background worker is not initialized!");
    }

    const commandId = UUID.getRandomUuid();
    const promise = new Promise<T>((resolve, reject) => {
      this._worker.onmessage = (e) => {
        this._worker.onerror = null;
        this._worker.onmessage = null;
        if (e.data.type === "error") {
          reject(`Background worker error: ${e.data.message}`);       
        } else if (e.data.id !== commandId) {
          reject(`Wrong response id: '${e.data.id}' instead of '${commandId}'`);
        } else {
          resolve(e.data.result);
        }
      };
      this._worker.onerror = (e) => {
        this._worker.onerror = null;
        this._worker.onmessage = null;
        reject(`Background worker error: ${e.message}`);
      };
    });
    this._worker.postMessage({id: commandId, name: commandName, args: commandArgs});

    return await promise;
  }
}
