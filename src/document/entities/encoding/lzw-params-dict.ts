import { ParseInfo, ParseResult } from "../../parser/data-parser";
import { FlateParamsDict } from "./flate-params-dict";

export class LzwParamsDict extends FlateParamsDict {
  /**
   * An indication of when to increase the code length. 
   * If the value of this entry is 0, code length increases shall be postponed 
   * as long as possible. If the value is 1, code length increases 
   * shall occur one code early. This parameter is included because 
   * LZW sample code distributed by some vendors increases the code length 
   * one code earlier than necessary
   */
  EarlyChange: 0 | 1 = 1;
  
  constructor() {
    super();
  }

  static parse(parseInfo: ParseInfo): ParseResult<LzwParamsDict> {    
    const dict = new LzwParamsDict();
    const parseResult = dict.tryParseProps(parseInfo);

    return parseResult
      ? {value: dict, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
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
          case "/EarlyChange":
            const earlyChangeFlag = parser.parseNumberAt(i, false);
            if (earlyChangeFlag) {
              this.EarlyChange = earlyChangeFlag.value === 1
                ? 1
                : 0;
              i = earlyChangeFlag.end + 1;
            } else {              
              throw new Error("Can't parse /EarlyChange property value");
            }
            break;
          default:            
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
