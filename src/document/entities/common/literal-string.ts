/* eslint-disable no-bitwise */
import { codes, keywordCodes } from "../../common/codes";
import { DataParser, ParseResult } from "../../parser/data-parser";

export class LiteralString {
  private constructor(readonly literal: string,
    readonly bytes: Uint8Array) { }
    
  static parse(parser: DataParser, start: number, 
    skipEmpty = true): ParseResult<LiteralString>  {       
    if (skipEmpty) {
      start = parser.skipEmpty(start);
    }
    if (parser.isOutside(start) || parser.getCharCode(start) !== codes.L_PARENTHESE) {
      return null;
    }

    const bytes: number[] = [];
    let i = start + 1;
    let prevCode: number;
    let code: number;
    let opened = 0;

    while (opened || code !== codes.R_PARENTHESE || prevCode === codes.BACKSLASH) {
      if (code) {        
        bytes.push(code);
        prevCode = code; 
      }

      code = parser.getCharCode(i++);

      if (prevCode !== codes.BACKSLASH) {
        if (code === codes.L_PARENTHESE) {
          opened += 1;
        } else if (opened && code === codes.R_PARENTHESE) {
          opened -= 1;
        }
      }
    }
    if (!bytes.length) {
      return null;
    }

    const literal = LiteralString.fromBytes(new Uint8Array(bytes));
    return {value: literal, start: start, end: i - 1};
  }

  /**
   * create LiteralString from escaped byte array
   * @param bytes escaped byte array
   */
  static fromBytes(bytes: Uint8Array): LiteralString {   
    const literal = new TextDecoder().decode(LiteralString.unescape(bytes));
    return new LiteralString(literal, bytes);
  }
  
  /**
   * create LiteralString from unescaped string
   * @param source unescaped string
   */
  static fromString(source: string): LiteralString {
    const bytes = LiteralString.escape(new TextEncoder().encode(source));
    return new LiteralString(source, bytes);
  }

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
        case codes.BACKSLASH: // TODO: handle escaped char code \ddd
          result.push(codes.BACKSLASH);
          result.push(codes.BACKSLASH);
          break;
        default:
          result.push(bytes[i]);
          break;
      }
    }
    return new Uint8Array(result);
  }
  
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

  toArray(bracketed = false): Uint8Array {
    return bracketed
      ? new Uint8Array([...keywordCodes.STR_LITERAL_START, 
        ...this.bytes, ...keywordCodes.STR_LITERAL_END])
      : new Uint8Array(this.bytes);
  }
}
