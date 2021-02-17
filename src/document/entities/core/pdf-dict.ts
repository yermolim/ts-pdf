import { keywordCodes } from "../../codes";
import { DictType } from "../../const";
import { CryptInfo } from "../../interfaces";
import { ParseInfo, ParseResult } from "../../parser/data-parser";
import { PdfObject } from "./pdf-object";

export abstract class PdfDict extends PdfObject {
  /** (Optional) The  type  of  PDF  object  that  this  dictionary  describes */
  readonly Type: DictType;

  // protected readonly _customProps = new Map<string, any>();
  // get customProps(): Map<string, any>{
  //   return new Map<string, any>(this._customProps);
  // }
  
  protected _streamId: number;
  get streamId(): number {
    return this._streamId;
  }

  protected constructor(type: DictType) {
    super();
    this.Type = type;
  }  
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const encoder = new TextEncoder();
    const bytes: number[] = [...keywordCodes.DICT_START];

    if (this.Type) {
      bytes.push(...keywordCodes.TYPE, ...encoder.encode(this.Type));
    }
    
    bytes.push(...keywordCodes.DICT_END);

    return new Uint8Array(bytes);
  }
  
  /**
   * try parse and fill public properties from data using info/parser if available
   */
  protected tryParseProps(parseInfo: ParseInfo): boolean {
    if (!parseInfo) {
      return false;
    }

    this._id = parseInfo.id;
    this._generation = parseInfo.generation;
    this._streamId = parseInfo.streamId;

    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end;

    let i = parser.skipToNextName(start, end - 1);
    if (i === -1) {
      // no props found, so the dict is invalid
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
          case "/Type":
            const type = parser.parseNameAt(i);
            if (type) {
              if (this.Type && this.Type !== type.value) {
                // wrong object type
                return false;
              }
              // TEMP: now we are only interested in /Type value, so no need to proceed further
              //i = type.end + 1;
              return true;
            }
            throw new Error("Can't parse /Type property value");
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
