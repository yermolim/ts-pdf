/* eslint-disable no-bitwise */
import { keywordCodes } from "../../codes";
import { CryptInfo, Encodable } from "../../interfaces";
import { DataParser, ParseResult } from "../../data-parser";

export class HexString implements Encodable {
  private constructor(readonly literal: string, 
    readonly hex: Uint8Array,
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
    const hex = this.literalToHex(literal);
    return new HexString(literal, hex, bytes);
  }

  static fromHexBytes(hex: Uint8Array): HexString {
    let literal = "";
    hex.forEach(x => literal += x.toString(16).padStart(2, "0"));
    const bytes = new TextEncoder().encode(literal);
    return new HexString(literal, hex, bytes);
  }

  static fromLiteralString(literal: string): HexString {
    const hex = this.literalToHex(literal);
    const bytes = new TextEncoder().encode(literal);
    return new HexString(literal, hex, bytes);
  };

  private static literalToHex(literal: string): Uint8Array {    
    const hex = new Uint8Array(literal.length / 2);
    for (let i = 0, j = 0; i < literal.length; i += 2, j++) {
      hex[j] = parseInt(literal.substr(i, 2), 16);
    } 
    return hex;
  }
 
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    return new Uint8Array([
      ...keywordCodes.STR_HEX_START, 
      ...this.bytes, 
      ...keywordCodes.STR_HEX_END,
    ]);
  }
}
