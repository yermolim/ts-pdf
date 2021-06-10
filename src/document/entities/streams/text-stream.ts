import { StreamType } from "../../const";
import { CryptInfo } from "../../common-interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { PdfStream } from "../core/pdf-stream";

export class TextStream extends PdfStream {
  
  constructor(type: StreamType = null) {
    super(type);
  }  

  static parse(parseInfo: ParseInfo): ParseResult<TextStream> {
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new TextStream();
      pdfObject.parseProps(parseInfo);
      return {value: pdfObject, start: parseInfo.bounds.start, end: parseInfo.bounds.end};
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }
  
  getText(): string {
    // TODO: implement
    return null;
  }

  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);
    return superBytes;
  }

  /**
   * fill public properties from data using info/parser if available
   */
  protected override parseProps(parseInfo: ParseInfo) {
    super.parseProps(parseInfo);
    
  }
}
