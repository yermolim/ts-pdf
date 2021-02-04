import { codes } from "../../common/codes";
import { DataParser, ParseResult } from "../../parser/data-parser";

export class DateString {
  private constructor(readonly source: string, 
    readonly date: Date) { }
    
  static parse(parser: DataParser, start: number, 
    skipEmpty = true): ParseResult<DateString>  {       
    if (skipEmpty) {
      start = parser.skipEmpty(start);
    }
    if (parser.isOutside(start) || parser.getCharCode(start) !== codes.L_PARENTHESE) {
      return null;
    }

    const end = parser.findCharIndex(codes.R_PARENTHESE, "straight", start);
    if (end === -1) {
      return null;
    }

    try {
      const date = DateString.fromArray(parser.subCharCodes(start + 1, end - 1));
      return {value: date, start, end};      
    } catch {
      return null;
    }
  }

  static fromDate(date: Date): DateString {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const source = `D:${year}${month}${day}${hours}${minutes}${seconds}`;
    return new DateString(source, date);
  }

  static fromString(source: string): DateString {
    const result = /D:(?<Y>\d{4})(?<M>\d{2})(?<D>\d{2})(?<h>\d{2})(?<m>\d{2})(?<s>\d{2})/.exec(source);
    const date = new Date(
      +result.groups.Y,
      +result.groups.M - 1,
      +result.groups.D,
      +result.groups.h,
      +result.groups.m,
      +result.groups.s,
    );
    return new DateString(source, date);
  }
  
  static fromArray(arr: Uint8Array): DateString {
    const source = new TextDecoder().decode(arr);
    return DateString.fromString(source);
  }

  toArray(): Uint8Array {
    return new TextEncoder().encode(this.source);
  }
}
