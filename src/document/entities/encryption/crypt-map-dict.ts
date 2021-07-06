import { valueTypes } from "../../spec-constants";
import { CryptInfo } from "../../encryption/interfaces";
import { ParserResult } from "../../data-parse/data-parser";
import { ParserInfo } from "../../data-parse/parser-info";
import { PdfDict } from "../core/pdf-dict";
import { CryptFilterDict } from "./crypt-filter-dict";

export class CryptMapDict extends PdfDict {
  protected readonly _filtersMap = new Map<string, CryptFilterDict>();
  
  constructor() {
    super(null);
  }
  
  static async parseAsync(parseInfo: ParserInfo): Promise<ParserResult<CryptMapDict>> {  
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new CryptMapDict();
      await pdfObject.parsePropsAsync(parseInfo);
      return {value: pdfObject, start: parseInfo.bounds.start, end: parseInfo.bounds.end};
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }
  
  getProp(name: string): CryptFilterDict { 
    return this._filtersMap.get(name);
  }

  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  


    if (this._filtersMap.size) {
      this._filtersMap.forEach((v, k) => 
        bytes.push(...encoder.encode(k), ...v.toArray(cryptInfo)));
    }

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
      parseResult = parser.parseNameAt(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          default:
            const entryType = await parser.getValueTypeAtAsync(i);
            if (entryType === valueTypes.DICTIONARY) { 
              const dictBounds = parser.getDictBoundsAt(i);
              if (dictBounds) {
                const filter = await CryptFilterDict.parseAsync({parser, bounds: dictBounds});
                if (filter) {
                  this._filtersMap.set(name, filter.value);
                  i = filter.end + 1;
                  break;
                }
              } 
            }
            // skip to next name
            i = await parser.skipToNextNameAsync(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };
  }
}
