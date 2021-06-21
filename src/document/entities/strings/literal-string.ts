/* eslint-disable no-bitwise */
import { codes, keywordCodes } from "../../encoding/char-codes";
import { CryptInfo, IEncodable } from "../../encryption/interfaces";
import { DataParser, ParserResult } from "../../data-parse/data-parser";

/**
 * Immutable class representing PDF literal string
 */
export class LiteralString implements IEncodable {
  private readonly _literal: string;
  get literal(): string {
    return this._literal;
  }

  private readonly _bytes: Uint8Array;
  get bytes(): Uint8Array {
    return this._bytes.slice();
  }

  private constructor(literal: string, bytes: Uint8Array) { 
    this._literal = literal;
    this._bytes = bytes;
  }
    
  static parse(parser: DataParser, start: number, cryptInfo: CryptInfo = null, 
    skipEmpty = true): ParserResult<LiteralString>  {  
      
    const bounds = parser.getLiteralBounds(start, skipEmpty);
    if (!bounds) {
      return;
    }

    let bytes = LiteralString.unescape(parser.subCharCodes(bounds.start + 1, bounds.end - 1));
    if (cryptInfo?.ref && cryptInfo.stringCryptor) {
      bytes = cryptInfo.stringCryptor.decrypt(bytes, cryptInfo.ref);
    }

    const result = LiteralString.fromBytes(bytes);
    return {value: result, start: bounds.start, end: bounds.end};
  }

  /**
   * create LiteralString from escaped byte array
   * @param bytes escaped byte array
   */
  static fromBytes(bytes: Uint8Array): LiteralString {
    const decoder = bytes[0] === 254 && bytes[1] === 255 // UTF-16 Big Endian
      ? new TextDecoder("utf-16be")
      : new TextDecoder();
    const literal = decoder.decode(bytes);
    return new LiteralString(literal, bytes);
  }
  
  /**
   * create LiteralString from unescaped string
   * @param source unescaped string
   */
  static fromString(source: string): LiteralString {    
    const bytes: number[] = [];
    bytes.push(254, 255);  // UTF-16 Big Endian byte order marks
    for (let i = 0; i < source.length; i++)
    {
      const charCode = source.charCodeAt(i);
      //char > 2 bytes is impossible since charCodeAt can only return 2 bytes
      bytes.push((charCode & 0xFF00) >>> 8);  //high byte (might be 0)
      bytes.push(charCode & 0xFF);  //low byte
    }
    return new LiteralString(source, new Uint8Array(bytes));
  }

  /**
   * escape characters (bytes) according to the PDF specification
   * @param bytes 
   * @returns 
   */
  private static escape(bytes: Uint8Array): Uint8Array {
    const result: number[] = [];    
    for (let i = 0; i < bytes.length; i++) {
      switch (bytes[i]) {
        case codes.LINE_FEED:
          result.push(codes.BACKSLASH);
          result.push(codes.n);
          break;
        case codes.CARRIAGE_RETURN:
          result.push(codes.BACKSLASH);
          result.push(codes.r);
          break;
        case codes.HORIZONTAL_TAB:
          result.push(codes.BACKSLASH);
          result.push(codes.t);
          break;
        case codes.BACKSPACE:
          result.push(codes.BACKSLASH);
          result.push(codes.b);
          break;
        case codes.FORM_FEED:
          result.push(codes.BACKSLASH);
          result.push(codes.f);
          break;
        case codes.L_PARENTHESE:
          result.push(codes.BACKSLASH);
          result.push(codes.L_PARENTHESE);
          break;
        case codes.R_PARENTHESE:
          result.push(codes.BACKSLASH);
          result.push(codes.R_PARENTHESE);
          break;
        case codes.BACKSLASH:
          result.push(codes.BACKSLASH);
          result.push(codes.BACKSLASH);
          break;
        default: // TODO: handle escaped char code \ddd
          result.push(bytes[i]);
          break;
      }
    }
    return new Uint8Array(result);
  }
  
  /**
   * unescape characters (bytes) according to the PDF specification
   * @param bytes 
   * @returns 
   */
  private static unescape(bytes: Uint8Array): Uint8Array {
    const result: number[] = [];   
    let escaped = false;
    for (let i = 0; i < bytes.length; i++) {
      if (escaped) {
        switch (bytes[i]) {
          case codes.n:
            result.push(codes.LINE_FEED);
            break;
          case codes.r:
            result.push(codes.CARRIAGE_RETURN);
            break;
          case codes.t:
            result.push(codes.HORIZONTAL_TAB);
            break;
          case codes.b:
            result.push(codes.BACKSPACE);
            break;
          case codes.f:
            result.push(codes.FORM_FEED);
            break;
          case codes.L_PARENTHESE:
            result.push(codes.L_PARENTHESE);
            break;
          case codes.R_PARENTHESE:
            result.push(codes.R_PARENTHESE);
            break;
          case codes.BACKSLASH: 
            result.push(codes.BACKSLASH);
            break;
          default: // TODO: handle escaped char code \ddd
            result.push(bytes[i]);
            break;
        }

        escaped = false;
        continue;
      }

      if (bytes[i] === codes.BACKSLASH) {
        escaped = true;
        continue;
      }
      result.push(bytes[i]);
    }
    return new Uint8Array(result);
  }

  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const bytes = cryptInfo?.ref && cryptInfo.stringCryptor
      ? cryptInfo.stringCryptor.encrypt(this._bytes, cryptInfo.ref)
      : this._bytes; 
    return new Uint8Array([
      ...keywordCodes.STR_LITERAL_START, 
      ...LiteralString.escape(bytes), 
      ...keywordCodes.STR_LITERAL_END,
    ]);
  }
}
