import { DataParser, ParserBounds, ParserOptions, ParserResult } 
  from "./data-parser";
import { ValueType } from "../spec-constants";
import { workerSrc } from "./bg-data-parser-worker-src";
import { UUID } from "ts-viewers-core";

class BgDataParserWorker {
  private readonly _worker: Worker;
  get worker(): Worker {
    return this._worker;
  }

  private _parser: BgDataParser;

  constructor(worker: Worker) {
    this._worker = worker;
  }
}

export class BgDataParser implements DataParser {  
  private static readonly _workersCount = 4;
  private static readonly _workerTimeout = 1000;

  private static readonly _workerPool: Worker[] = [];
  private static readonly _freeWorkers = new Set<Worker>();
  
  private static _initialized: boolean;

  private _data: ArrayBuffer | ArrayBufferLike;  
  private readonly _maxIndex: number;
  public get maxIndex(): number {
    return this._maxIndex;
  }

  private constructor(data: Uint8Array) {
    if (!data?.length) {
      throw new Error("Data is empty");
    }
    this._data = data.slice().buffer;
    this._maxIndex = data.length - 1;
  }

  static tryGetParser(data: Uint8Array): BgDataParser {
    try {
      const parser = new BgDataParser(data);
      return parser;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  static destroy() {
    this._freeWorkers.clear();
    this._workerPool.forEach(x => x.terminate());
    this._workerPool.length = 0;
    this._initialized = false;
  }
  
  private static initWorkers() {
    if (this._initialized) {
      return;
    }

    const srcBlob = new Blob([workerSrc], { type: "text/plain;charset=utf-8;" });
    const srcUri = URL.createObjectURL(srcBlob);
        
    for (let i = 0; i < this._workersCount; i++) {
      const worker = new Worker(srcUri);
      this._workerPool.push(worker);
      this._freeWorkers.add(worker);
    }

    this._initialized = true;
  };
  
  private static async getFreeWorkerFromPoolAsync(): Promise<Worker> {
    this.initWorkers();

    if (this._freeWorkers.size) {
      // worker is available. remove it from free list and return to the caller
      const worker = this._freeWorkers.values().next().value;
      this._freeWorkers.delete(worker);
      return worker;
    }

    const freeWorkerPromise = new Promise<Worker>((resolve, reject) => {
      const start = performance.now();
      // worker is not available. start polling until it will be available
      const interval = setInterval(() => {
        if (this._freeWorkers.size) {
          const worker = this._freeWorkers.values().next().value;
          this._freeWorkers.delete(worker);
          clearInterval(interval);
          resolve(worker);
        }
        if (performance.now() - start > this._workerTimeout) {
          clearInterval(interval);
          reject("Free worker waiting timeout exceeded");
        }
      }, 10);
    });
    return await freeWorkerPromise;
  }
  
  private static returnWorkerToPool(worker: Worker) {
    if (this._initialized) {
      this._freeWorkers.add(worker);
    }
  }
  
  private static async transferDataToWorker(worker: Worker, buffer: ArrayBuffer | ArrayBufferLike) {
    const workerPromise = new Promise<void>((resolve, reject) => {
      worker.onmessage = (e) => {
        if (e.data.type === "success") {
          resolve();
        } else {
          console.log(e);
          console.log(e.data);

          reject(e);
        }
      };
      worker.onerror = (e) => {
        console.log(e);
        console.log(e.message);        
        
        reject(e);
      };
      worker.postMessage({name: "data-set", bytes: buffer}, [buffer]);
    });

    try {
      await workerPromise;
    } catch (e) {
      console.error(e);
      throw new Error("Error while transfering parser data to worker");
    }
  }
  
  private static async transferDataFromWorker(worker: Worker): Promise<ArrayBuffer | ArrayBufferLike> {
    const workerPromise = new Promise<ArrayBuffer | ArrayBufferLike>((resolve, reject) => {
      worker.onmessage = (e) => {
        if (e.data.type === "success") {
          const buffer = e.data.bytes;
          resolve(buffer);
        } else {
          reject(e);
        }
      };
      worker.onerror = (e) => reject(e);
      worker.postMessage({name: "data-reset"});
    });

    try {
      const buffer = await workerPromise;
      return buffer;
    } catch {
      throw new Error("Error while transfering parser data from worker");
    }
  }

  destroy() {

  }
  
  /**
   * get a new parser instance which inner data array is a slice of the source parser data
   * @param start slice start index
   * @param end slice end index (char at the end index is INCLUDED into the slice)
   * @returns 
   */
  async getSubParserAsync(start: number, end?: number): Promise<DataParser> {
    const data = await this.execCommandAsync<Uint8Array>("slice-char-codes", [start, end]);
    const parser = BgDataParser.tryGetParser(data);
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

  private async execCommandAsync<T>(commandName: string, commandArgs: any[] = []): Promise<T> {
    const dataBuffer = this._data;
    
    const worker = await BgDataParser.getFreeWorkerFromPoolAsync();

    await BgDataParser.transferDataToWorker(worker, dataBuffer);

    const commandId = UUID.getRandomUuid();
    const commandResultPromise = new Promise<T>((resolve, reject) => {
      worker.onmessage = (e) => {
        worker.onerror = null;
        worker.onmessage = null;
        if (e.data.type === "error") {
          reject(`Background worker error: ${e.data.message}`);       
        } else if (e.data.id !== commandId) {
          reject(`Wrong response id: '${e.data.id}' instead of '${commandId}'`);
        } else {
          resolve(e.data.result);
        }
      };
      worker.onerror = (e) => {
        worker.onerror = null;
        worker.onmessage = null;
        reject(`Background worker error: ${e.message}`);
      };
    });
    worker.postMessage({id: commandId, name: commandName, args: commandArgs});
    const result = await commandResultPromise; 

    const returnedBuffer = await BgDataParser.transferDataFromWorker(worker);
    this._data = returnedBuffer;    

    BgDataParser.returnWorkerToPool(worker);

    return result;
  }
}
