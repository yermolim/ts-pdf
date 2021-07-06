import { codes } from "../../encoding/char-codes";
import { CryptInfo } from "../../encryption/interfaces";
import { DataParser, ParserResult } from "../../data-parse/data-parser";

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

  static async parseAsync(parser: DataParser, start: number, 
    skipEmpty = true): Promise<ParserResult<BorderArray>> {
    if (skipEmpty) {
      start = await parser.findNonSpaceIndexAsync(true, start);
    }
    if (start < 0 || start > parser.maxIndex 
      || !(await parser.isCodeAtAsync(start, codes.L_BRACKET))) {
      return null;
    }    
    
    const hCornerR = await parser.parseNumberAtAsync(start + 1);
    if (!hCornerR || isNaN(hCornerR.value)) {
      return null;
    }    

    const vCornerR = await parser.parseNumberAtAsync(hCornerR.end + 2);
    if (!vCornerR || isNaN(vCornerR.value)) {
      return null;
    }

    const width = await parser.parseNumberAtAsync(vCornerR.end + 2);
    if (!width || isNaN(width.value)) {
      return null;
    }

    const next = await parser.findNonSpaceIndexAsync(true, width.end + 1);
    if (!next) {
      return null;
    } else if (await parser.isCodeAtAsync(next, codes.R_BRACKET)) {
      // dash array is absent
      return {
        value: new BorderArray(hCornerR.value, vCornerR.value, width.value),
        start,
        end: next,
      };
    } else if (await parser.isCodeAtAsync(next, codes.L_BRACKET)) {      
      // dash array is present
      const dash = await parser.parseNumberAtAsync(next + 1);
      if (!dash || isNaN(dash.value)) {
        return null;
      }    
      
      const gap = await parser.parseNumberAtAsync(dash.end + 2);
      if (!gap || isNaN(gap.value)) {
        return null;
      }   

      const dashEnd = await parser.findNonSpaceIndexAsync(true, gap.end + 1);
      if (!dashEnd || !(await parser.isCodeAtAsync(dashEnd, codes.R_BRACKET))) {
        return null;
      }

      const arrayEnd = await parser.findNonSpaceIndexAsync(true, dashEnd + 1);
      if (!arrayEnd || !(await parser.isCodeAtAsync(arrayEnd, codes.R_BRACKET))) {
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
