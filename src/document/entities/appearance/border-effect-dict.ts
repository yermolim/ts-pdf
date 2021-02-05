import { ParseInfo, ParseResult } from "../../parser/data-parser";
import { PdfDict } from "../core/pdf-dict";

export const borderEffects = {
  NONE: "/S",
  CLOUDY: "/C",
};
export type BorderEffect = typeof borderEffects[keyof typeof borderEffects];

export class BorderEffectDict extends PdfDict {
  /**(Optional) A name representing the border effect to apply */
  S: BorderEffect = borderEffects.NONE;
  /**(Optional; valid only if the value of S is C) 
   * A number describing the intensity of the effect, in the range 0 to 2 */
  L = 0;
  
  constructor() {
    super(null);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<BorderEffectDict> {    
    const trailer = new BorderEffectDict();
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
          case "/S":
            const style = parser.parseNameAt(i, true);
            if (style && (<string[]>Object.values(borderEffects)).includes(style.value)) {
              this.S = <BorderEffect>style.value;
              i = style.end + 1;              
            } else {              
              throw new Error("Can't parse /S property value");
            }
            break;  
          case "/L":
            const intensity = parser.parseNumberAt(i, true);
            if (intensity) {
              this.L = Math.min(Math.max(0, intensity.value), 2);
              i = intensity.end + 1;
            } else {              
              throw new Error("Can't parse /L property value");
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
