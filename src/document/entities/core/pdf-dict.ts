import { keywordCodes } from "../../encoding/char-codes";
import { DictType } from "../../spec-constants";
import { CryptInfo } from "../../encryption/interfaces";
import { ParseResult } from "../../data-parse/data-parser";
import { ParseInfo } from "../../data-parse/parser-info";
import { PdfObject } from "./pdf-object";

export abstract class PdfDict extends PdfObject {
  /** (Optional) The  type  of  PDF  object  that  this  dictionary  describes */
  readonly Type: DictType;

  // protected readonly _customProps = new Map<string, any>();
  // get customProps(): Map<string, any>{
  //   return new Map<string, any>(this._customProps);
  // }
  
  protected _streamId: number;
  /**pdf object id of the stream the object is parsed from */
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
   * try to parse and fill public properties from data using parse info
   */
  protected parseProps(parseInfo: ParseInfo) {
    if (!parseInfo) {
      throw new Error("Parse info is empty");
    }

    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end;

    this._ref = parseInfo.cryptInfo?.ref;
    this._streamId = parseInfo.streamId;
    this._sourceBytes = parser.sliceCharCodes(start, end);

    let i = parser.skipToNextName(start, end - 1);
    if (i === -1) {     
      throw new Error("Dict is empty (has no properties)");
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
                throw new Error(`Ivalid dict type: '${type.value}' instead of '${this.Type}'`);
              }
              // we are only interested in /Type value, so no need to proceed further
              return;
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
  }
}
