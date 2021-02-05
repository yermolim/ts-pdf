import { dictTypes, Pair } from "../../common/const";
import { ParseInfo, ParseResult } from "../../parser/data-parser";
import { PdfDict } from "../core/pdf-dict";

/**
 * Flags  specifying  various  characteristics of the annotation
 */
export const borderStyles = {
  SOLID: "/S",
  DASHED: "/D",
  BEVELED: "/B",
  INSET: "/I",
  UNDERLINE: "/U",
} as const;
export type BorderStyle = typeof borderStyles[keyof typeof borderStyles];

export class BorderStyleDict extends PdfDict {
  /**(Optional) The border width in points. 
   * If this value is 0, no border shall drawn */
  W = 1;
  /**(Optional) The border style */
  S: BorderStyle = borderStyles.SOLID;
  /**(Optional) A dash array defining a pattern of dashes and gaps 
   * that shall beused in drawing a dashed border. [dash gap] */
  D: Pair = [3, 0];
  
  constructor() {
    super(dictTypes.BORDER_STYLE);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<BorderStyleDict> {    
    const trailer = new BorderStyleDict();
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
        switch (name) {
          case "/W":
            const width = parser.parseNumberAt(i, true);
            if (width) {
              this.W = width.value;
              i = width.end + 1;
            } else {              
              throw new Error("Can't parse /W property value");
            }
            break;
          case "/S":
            const style = parser.parseNameAt(i, true);
            if (style && (<string[]>Object.values(borderStyles)).includes(style.value)) {
              this.S = <BorderStyle>style.value;
              i = style.end + 1;              
            } else {              
              throw new Error("Can't parse /S property value");
            }
            break;  
          case "/D":
            const dashGap = parser.parseNumberArrayAt(i, true);
            if (dashGap) {
              this.D = [
                dashGap.value[0] ?? 3,
                dashGap.value[1] ?? 0,
              ];
              i = dashGap.end + 1;
            } else {              
              throw new Error("Can't parse /D property value");
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
