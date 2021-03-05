import { valueTypes } from "../../const";
import { CryptInfo } from "../../common-interfaces";
import { DataParser, ParseInfo, ParseResult } from "../../data-parser";
import { ObjectId } from "../core/object-id";
import { PdfDict } from "../core/pdf-dict";
import { codes } from "../../codes";

export class ObjectMapDict extends PdfDict {
  protected readonly _objectIdMap = new Map<string, ObjectId>();
  protected readonly _dictParserMap = new Map<string, ParseInfo>();
  
  constructor() {
    super(null);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<ObjectMapDict> {    
    const objectMap = new ObjectMapDict();
    const parseResult = objectMap.parseProps(parseInfo);

    return parseResult
      ? {value: objectMap, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
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
  
  getDictParser(name: string): ParseInfo {
    return this._dictParserMap.get(name);
  }

  *getDictParsers(): Iterable<[string, ParseInfo]> {
    for (const pair of this._dictParserMap) {
      yield pair;
    }
    return;
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    this._objectIdMap.forEach((v, k) => {
      bytes.push(...encoder.encode(k), codes.WHITESPACE, ...v.toArray(cryptInfo));
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
  protected parseProps(parseInfo: ParseInfo): boolean {
    const superIsParsed = super.parseProps(parseInfo);
    if (!superIsParsed) {
      return false;
    }

    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end;
    
    let i = parser.skipToNextName(start, end - 1);
    if (i === -1) {
      // no required props found
      return false;
    }
    let name: string;
    let parseResult: ParseResult<string>;
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
                const dictParseInfo: ParseInfo = {
                  parser: new DataParser(parser.sliceCharCodes(dictBounds.start, dictBounds.end)), 
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

    return true;
  }
}
