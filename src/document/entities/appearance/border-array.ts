import { codes } from "../../encoding/char-codes";
import { CryptInfo } from "../../common-interfaces";
import { DataParser, ParseResult } from "../../data-parser";

/**
 * Immutable class representing PDF border array
 */
export class BorderArray {
  readonly hCornerR: number;
  readonly vCornerR: number;
  readonly width: number;
  readonly dash: number;
  readonly gap: number;

  constructor(hCornerR: number, vCornerR: number, 
    width: number, dash?: number, gap?: number) {

    this.hCornerR = hCornerR ?? 0;
    this.vCornerR = vCornerR ?? 0;
    this.width = width ?? 1;
    this.dash = dash ?? 3;
    this.gap = gap ?? 0;
  }

  static parse(parser: DataParser, start: number, 
    skipEmpty = true): ParseResult<BorderArray> {
    if (skipEmpty) {
      start = parser.findNonSpaceIndex(true, start);
    }
    if (start < 0 || start > parser.maxIndex 
      || parser.getCharCode(start) !== codes.L_BRACKET) {
      return null;
    }    
    
    const hCornerR = parser.parseNumberAt(start + 1);
    if (!hCornerR || isNaN(hCornerR.value)) {
      return null;
    }    

    const vCornerR = parser.parseNumberAt(hCornerR.end + 2);
    if (!vCornerR || isNaN(vCornerR.value)) {
      return null;
    }

    const width = parser.parseNumberAt(vCornerR.end + 2);
    if (!width || isNaN(width.value)) {
      return null;
    }

    const next = parser.findNonSpaceIndex(true, width.end + 1);
    if (!next) {
      return null;
    } else if (parser.getCharCode(next) === codes.R_BRACKET) {
      // dash array is absent
      return {
        value: new BorderArray(hCornerR.value, vCornerR.value, width.value),
        start,
        end: next,
      };
    } else if (parser.getCharCode(next) === codes.L_BRACKET) {      
      // dash array is present
      const dash = parser.parseNumberAt(next + 1);
      if (!dash || isNaN(dash.value)) {
        return null;
      }    
      
      const gap = parser.parseNumberAt(dash.end + 2);
      if (!gap || isNaN(gap.value)) {
        return null;
      }   

      const dashEnd = parser.findNonSpaceIndex(true, gap.end + 1);
      if (!dashEnd || parser.getCharCode(dashEnd) !== codes.R_BRACKET) {
        return null;
      }

      const arrayEnd = parser.findNonSpaceIndex(true, dashEnd + 1);
      if (!arrayEnd || parser.getCharCode(arrayEnd) !== codes.R_BRACKET) {
        return null;
      }
      
      return {
        value: new BorderArray(hCornerR.value, vCornerR.value, width.value,
          dash.value, gap.value),
        start,
        end: arrayEnd,
      };
    } 

    return null;
  }

  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const source = this.dash && this.gap 
      ? `[${this.hCornerR} ${this.vCornerR} ${this.width}]`
      : `[${this.hCornerR} ${this.vCornerR} ${this.width} [${this.dash} ${this.gap}]]`;
    return new TextEncoder().encode(source);
  }
}
