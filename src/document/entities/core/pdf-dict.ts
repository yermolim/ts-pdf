import { DictType } from "../../common/const";
import { ParseInfo, ParseResult } from "../../parser/data-parser";

export class PdfDict {
  /** (Optional) The  type  of  PDF  object  that  this  dictionary  describes */
  readonly Type: DictType;

  protected readonly _customProps = new Map<string, any>();
  get customProps(): Map<string, any>{
    return new Map<string, any>(this._customProps);
  }

  protected constructor(type: DictType) {
    this.Type = type;
  }
  
  /**
   * try parse and fill public properties from data using info/parser if available
   */
  protected tryParseProps(parseInfo: ParseInfo): boolean {
    if (!parseInfo) {
      return false;
    }

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
            } else {
              throw new Error("Can't parse /Type property value");
            }
          // TODO: add case for custom props
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
