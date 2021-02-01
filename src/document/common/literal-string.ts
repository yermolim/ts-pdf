/* eslint-disable no-bitwise */
import { codes, keywordCodes } from "./codes";

export class LiteralString {
  private constructor(readonly literal: string,
    readonly bytes: Uint8Array) { }

  static fromBytes(bytes: Uint8Array): LiteralString {   
    const literal = new TextDecoder().decode(bytes);
    return new LiteralString(literal, bytes);
  }

  static fromLiteralString(literal: string): LiteralString {
    const bytes = new TextEncoder().encode(literal);
    return new LiteralString(literal, bytes);
  }

  toArray(bracketed = false): Uint8Array {
    return bracketed
      ? new Uint8Array([...keywordCodes.STR_LITERAL_START, 
        ...this.bytes, ...keywordCodes.STR_LITERAL_END])
      : new Uint8Array(this.bytes);
  }
}
