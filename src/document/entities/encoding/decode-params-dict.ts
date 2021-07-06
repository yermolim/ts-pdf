import { dictTypes, valueTypes } from "../../spec-constants";
import { CryptInfo } from "../../encryption/interfaces";
import { DataParser, ParserResult } from "../../data-parse/data-parser";
import { ParserInfo } from "../../data-parse/parser-info";
import { PdfDict } from "../core/pdf-dict";
import { ObjectId } from "../core/object-id";

export class DecodeParamsDict extends PdfDict {  
  protected readonly _intPropMap = new Map<string, number>();
  protected readonly _boolPropMap = new Map<string, boolean>();
  protected readonly _namePropMap = new Map<string, string>();
  protected readonly _refPropMap = new Map<string, ObjectId>();
  
  constructor() {
    super(dictTypes.EMPTY);
  }

  static async parseAsync(parseInfo: ParserInfo): Promise<ParserResult<DecodeParamsDict>> {  
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new DecodeParamsDict();
      await pdfObject.parsePropsAsync(parseInfo);
      return {value: pdfObject, start: parseInfo.bounds.start, end: parseInfo.bounds.end};
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }
  
  static async parseArrayAsync(parser: DataParser, start: number, cryptInfo: CryptInfo = null, 
    skipEmpty = true): Promise<ParserResult<DecodeParamsDict[]>> {
    const arrayBounds = await parser.getArrayBoundsAtAsync(start, skipEmpty);
    if (!arrayBounds) {
      return null;
    }

    const paramsDicts: DecodeParamsDict[] = [];
    let current: ParserResult<DecodeParamsDict>;
    let i = arrayBounds.start + 1;
    while(i < arrayBounds.end) {
      const paramsBounds = await parser.getDictBoundsAtAsync(i);
      current = await DecodeParamsDict.parseAsync({parser, bounds: paramsBounds, cryptInfo});
      if (!current) {
        break;
      }
      paramsDicts.push(current.value);
      i = current.end + 1;
    }

    return {value: paramsDicts, start: arrayBounds.start, end: arrayBounds.end};
  }

  getIntProp(name: string): number {
    return this._intPropMap.get(name);
  }
  
  getBoolProp(name: string): boolean {
    return this._boolPropMap.get(name);
  }

  getNameProp(name: string): string {
    return this._namePropMap.get(name);
  }

  getRefProp(name: string): ObjectId {
    return this._refPropMap.get(name);
  }
  
  setIntProp(name: string, value: number) {
    return this._intPropMap.set(name, value);
  }
  
  setBoolProp(name: string, value: boolean)  {
    return this._boolPropMap.set(name, value);
  }

  setNameProp(name: string, value: string)  {
    return this._namePropMap.set(name, value);
  }

  setRefProp(name: string, value: ObjectId) {
    return this._refPropMap.set(name, value);
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    this._intPropMap.forEach((v, k) => 
      bytes.push(...encoder.encode(k), ...encoder.encode(" " + v)));
    this._boolPropMap.forEach((v, k) => 
      bytes.push(...encoder.encode(k), ...encoder.encode(" " + v)));
    this._namePropMap.forEach((v, k) => 
      bytes.push(...encoder.encode(k), ...encoder.encode(v)));
    this._refPropMap.forEach((v, k) => 
      bytes.push(...encoder.encode(k), ...v.toArray(cryptInfo)));

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }
  
  /**
   * fill public properties from data using info/parser if available
   */
  protected override async parsePropsAsync(parseInfo: ParserInfo) {
    await super.parsePropsAsync(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end;
    
    let i = await parser.skipToNextNameAsync(start, end - 1);
    let name: string;
    let parseResult: ParserResult<string>;
    while (true) {
      parseResult = await parser.parseNameAtAsync(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        const valueType = await parser.getValueTypeAtAsync(i);
        switch (valueType) {
          case valueTypes.NUMBER:
            const intValue = await parser.parseNumberAtAsync(i, false);
            if (intValue) {
              this._intPropMap.set(name, intValue.value);
              i = intValue.end + 1;
              continue;
            }   
            break; 
          case valueTypes.BOOLEAN:       
            const boolValue = await parser.parseBoolAtAsync(i);
            if (boolValue) {
              this._boolPropMap.set(name, boolValue.value);
              i = boolValue.end + 1;
              continue;
            } 
            break; 
          case valueTypes.NAME:       
            const nameValue = await parser.parseNameAtAsync(i);
            if (nameValue) {
              this._namePropMap.set(name, nameValue.value);
              i = nameValue.end + 1;
              continue;
            }
            break;              
          case valueTypes.REF:       
            const refValue = await ObjectId.parseRefAsync(parser, i);
            if (refValue) {
              this._refPropMap.set(name, refValue.value);
              i = refValue.end + 1;
              continue;
            }
            break;
        } 
        i = await parser.skipToNextNameAsync(i, end - 1);
      } else {
        break;
      }
    };
  }
}
