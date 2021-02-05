import { ParseInfo, ParseResult } from "../../parser/data-parser";
import { ObjectId } from "../common/object-id";
import { PdfDict } from "../core/pdf-dict";

export class AppearanceSubDict extends PdfDict {
  protected readonly _customProps = new Map<string, ObjectId>();
  get customProps(): Map<string, ObjectId>{
    return new Map<string, ObjectId>(this._customProps);
  }
  
  constructor() {
    super(null);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<AppearanceSubDict> {    
    const trailer = new AppearanceSubDict();
    const parseResult = trailer.tryParseProps(parseInfo);

    return parseResult
      ? {value: trailer, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
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

        const id = ObjectId.parseRef(parser, i);
        if (id) {
          this._customProps.set(name, id.value);
          i = id.end + 1;
        } else {   
          // throw new Error("Can't parse property value");           
          i = parser.skipToNextName(i, end - 1);
        }
      } else {
        break;
      }
    };

    return true;
  }
}
