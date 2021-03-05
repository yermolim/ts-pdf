import { StreamType } from "../../const";
import { CryptInfo } from "../../common-interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { PdfStream } from "../core/pdf-stream";

export class TextStream extends PdfStream {
  
  constructor(type: StreamType = null) {
    super(type);
  }  

  static parse(parseInfo: ParseInfo): ParseResult<TextStream> {    
    const stream = new TextStream();
    const parseResult = stream.parseProps(parseInfo);

    return parseResult
      ? {value: stream, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }
  
  getText(): string {
    // TODO: implement
    return null;
  }

  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);
    return superBytes;
  }

  /**
   * fill public properties from data using info/parser if available
   */
  protected parseProps(parseInfo: ParseInfo): boolean {
    const superIsParsed = super.parseProps(parseInfo);
    if (!superIsParsed) {
      return false;
    }

    return true;
  }
}
