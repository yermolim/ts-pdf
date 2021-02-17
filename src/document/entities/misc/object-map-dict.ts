import { valueTypes } from "../../const";
import { ParseInfo, ParseResult } from "../../parser/data-parser";
import { ObjectId } from "../common/object-id";
import { PdfDict } from "../core/pdf-dict";

export class ObjectMapDict extends PdfDict {
  protected readonly _objectIdMap = new Map<string, ObjectId>();
  
  constructor() {
    super(null);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<ObjectMapDict> {    
    const objectMap = new ObjectMapDict();
    const parseResult = objectMap.tryParseProps(parseInfo);

    return parseResult
      ? {value: objectMap, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }
  
  getProp(name: string): ObjectId {
    return this._objectIdMap.get(name);
  }
  
  toArray(): Uint8Array {
    const superBytes = super.toArray();  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    this._objectIdMap.forEach((v, k) => {
      bytes.push(...encoder.encode(k), ...v.toArray());
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
  protected tryParseProps(parseInfo: ParseInfo): boolean {
    const superIsParsed = super.tryParseProps(parseInfo);
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
