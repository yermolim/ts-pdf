/* eslint-disable no-bitwise */
import { codes, keywordCodes } from "../../common/codes";
import { DataParser, ParseResult } from "../../parser/data-parser";

export class HexString {
  private constructor(readonly literal: string, 
    readonly hex: string,
    readonly bytes: Uint8Array) { }
    
  static parse(parser: DataParser, start: number, 
    skipEmpty = true): ParseResult<HexString>  {   

    const bounds = parser.getHexBounds(start, skipEmpty);
    if (!bounds) {
      return null;
    }

    const hex = HexString.fromBytes(parser.sliceCharCodes(bounds.start, bounds.end));
    return {value: hex, start: bounds.start, end: bounds.end};
  }  
  
  static parseArray(parser: DataParser, start: number, 
    skipEmpty = true): ParseResult<HexString[]>  {
    const arrayBounds = parser.getArrayBoundsAt(start, skipEmpty);
    if (!arrayBounds) {
      return null;
    }

    const hexes: HexString[] = [];
    let current: ParseResult<HexString>;
    let i = arrayBounds.start + 1;
    while(i < arrayBounds.end) {
      current = HexString.parse(parser, i, true);
      if (!current) {
        break;
      }
      hexes.push(current.value);
      i = current.end + 1;
    }

    return {value: hexes, start: arrayBounds.start, end: arrayBounds.end};
  }

  static fromBytes(bytes: Uint8Array): HexString {  
    bytes = bytes.subarray(1, bytes.length - 1); 
    const literal = new TextDecoder().decode(bytes);   
    const hex = Array.from(bytes, (byte, i) => 
      ("0" + literal.charCodeAt(i).toString(16)).slice(-2)).join("");  
    return new HexString(literal, hex, bytes);
  }

  static fromHexString(hex: string): HexString {
    const bytes = new TextEncoder().encode(hex);
    const literal = new TextDecoder().decode(bytes); 
    return new HexString(literal, hex, bytes);
  }

  static fromLiteralString(literal: string): HexString {
    const hex = Array.from(literal, (char, i) => 
      ("000" + literal.charCodeAt(i).toString(16)).slice(-4)).join("");
    const bytes = new TextEncoder().encode(hex);
    return new HexString(literal, hex, bytes);
  };

  toArray(bracketed = true): Uint8Array {
    return bracketed
      ? new Uint8Array([...keywordCodes.STR_HEX_START, 
        ...this.bytes, ...keywordCodes.STR_HEX_END])
      : new Uint8Array(this.bytes);
  }
}
