import { valueTypes } from "../../spec-constants";

import { CryptInfo } from "../../encryption/interfaces";

import { DataParser, ParserResult } from "../../data-parse/data-parser";
import { DefaultDataParser } from "../../data-parse/default-data-parser";
import { ParserInfo } from "../../data-parse/parser-info";

import { ObjectId } from "../core/object-id";
import { PdfDict } from "../core/pdf-dict";

export class ObjectMapDict extends PdfDict {
  static dataParserConstructor: new (data: Uint8Array) => DataParser = DefaultDataParser;
  
  protected readonly _objectIdMap = new Map<string, ObjectId>();
  protected readonly _dictParserMap = new Map<string, ParserInfo>();
  
  constructor() {
    super(null);
  }
  
  static parse(parseInfo: ParserInfo): ParserResult<ObjectMapDict> {  
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new ObjectMapDict();
      pdfObject.parseProps(parseInfo);
      return {value: pdfObject, start: parseInfo.bounds.start, end: parseInfo.bounds.end};
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }
  
  getObjectId(name: string): ObjectId {
    return this._objectIdMap.get(name);
  }

  *getObjectIds(): Iterable<[string, ObjectId]> {
    for (const pair of this._objectIdMap) {
      yield pair;
    }
    return;
  }
  
  getDictParser(name: string): ParserInfo {
    return this._dictParserMap.get(name);
  }

  *getDictParsers(): Iterable<[string, ParserInfo]> {
    for (const pair of this._dictParserMap) {
      yield pair;
    }
    return;
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    this._objectIdMap.forEach((v, k) => {
      bytes.push(...encoder.encode(k + " "), ...v.toArray(cryptInfo));
    });

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }
  
  /**
   * fill public properties from data using info/parser if available
   */
  protected override parseProps(parseInfo: ParserInfo) {
    super.parseProps(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end;
    
    let i = parser.skipToNextName(start, end - 1);
    let name: string;
    let parseResult: ParserResult<string>;
    while (true) {
      parseResult = parser.parseNameAt(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          default:
            const entryType = parser.getValueTypeAt(i);
            if (entryType === valueTypes.REF) {              
              const id = ObjectId.parseRef(parser, i);
              if (id) {
                this._objectIdMap.set(name, id.value);
                i = id.end + 1;
                break;
              }
            } else if (entryType === valueTypes.DICTIONARY) {
              const dictBounds = parser.getDictBoundsAt(i);
              if (dictBounds) {
                const dictParseInfo: ParserInfo = {
                  parser: new ObjectMapDict.dataParserConstructor(parser.sliceCharCodes(dictBounds.start, dictBounds.end)), 
                  bounds: {
                    start: 0, 
                    end: dictBounds.end - dictBounds.start, 
                    contentStart: dictBounds.contentStart - dictBounds.start,
                    contentEnd: dictBounds.contentEnd - dictBounds.start,
                  }, 
                  cryptInfo: parseInfo.cryptInfo,
                };
                this._dictParserMap.set(name, dictParseInfo);
                i = dictBounds.end + 1;
                break;
              }
            }
            // skip to next name
            i = parser.skipToNextName(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };
  }
}
