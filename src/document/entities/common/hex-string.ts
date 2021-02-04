/* eslint-disable no-bitwise */
import { codes, keywordCodes } from "../../common/codes";
import { DocumentParser, ParseResult } from "../../document-parser";

export class HexString {
  private constructor(readonly literal: string, 
    readonly hex: string,
    readonly bytes: Uint8Array) { }
    
  static parse(parser: DocumentParser, start: number, 
    skipEmpty = true): ParseResult<HexString>  {   

    if (skipEmpty) {
      start = parser.skipEmpty(start);
    }
    if (parser.isOutside(start) || parser.getCharCode(start) !== codes.LESS) {
      return null;
    }

    const end = parser.findCharIndex(codes.GREATER, "straight", start + 1);
    if (end === -1) {
      return;
    }

    const hex = HexString.fromBytes(parser.sliceCharCodes(start, end));
    return {value: hex, start, end};
  }

  static fromBytes(bytes: Uint8Array): HexString {   
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

  toArray(bracketed = false): Uint8Array {
    return bracketed
      ? new Uint8Array([...keywordCodes.STR_HEX_START, 
        ...this.bytes, ...keywordCodes.STR_HEX_END])
      : new Uint8Array(this.bytes);
  }
}
