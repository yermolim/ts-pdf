import { StreamType } from "../../const";
import { CryptInfo } from "../../interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { PdfStream } from "../core/pdf-stream";

export class TextStream extends PdfStream {
  
  constructor(type: StreamType = null) {
    super(type);
  }  

  static parse(parseInfo: ParseInfo): ParseResult<TextStream> {    
    const stream = new TextStream();
    const parseResult = stream.tryParseProps(parseInfo);

    return parseResult
      ? {value: stream, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }
  
  getText(): string {
    // TODO: implement
    return null;
  }

  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray();
    return superBytes;
  }

  /**
   * fill public properties from data using info/parser if available
   */
  protected tryParseProps(parseInfo: ParseInfo): boolean {
    const superIsParsed = super.tryParseProps(parseInfo);
    if (!superIsParsed) {
      return false;
    }

    return true;
  }
}
