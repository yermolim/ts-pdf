import { dictTypes } from "../../const";
import { CryptInfo } from "../../common-interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { DateString } from "../strings/date-string";
import { LiteralString } from "../strings/literal-string";
import { PdfDict } from "../core/pdf-dict";

export class InfoDict extends PdfDict {
  /** (Optional; PDF 1.1+) */
  Title: LiteralString;
  /** (Optional) */
  Author: LiteralString;
  /** (Optional; PDF 1.1+) */
  Subject: LiteralString;
  /** (Optional; PDF 1.1+) */
  Keywords: LiteralString;
  /**
   * (Optional) If the document was converted to PDF from another format, 
   * the name of the conforming product that created the original document 
   * from which it was converted
   */
  Creator: LiteralString;
  /**
   * (Optional) If the document was converted to PDF from another format, 
   * the name of the conforming product that converted it to PDF
   */
  /** (Optional) */
  Producer: LiteralString;
  /** (Optional) */
  CreationDate: DateString;
  /**
   * (Required if PieceInfo is present in the document catalogue; 
   * otherwise optional; PDF 1.1+) The date and time 
   * the document was most recently modified, in human-readable form
   */
  ModDate: DateString;
  
  constructor() {
    super(dictTypes.EMPTY);
  }

  static parse(parseInfo: ParseInfo): ParseResult<InfoDict> {    
    const info = new InfoDict();
    const parseResult = info.tryParseProps(parseInfo);

    return parseResult
      ? {value: info, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }  
   
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.Title) {
      bytes.push(...encoder.encode("/Title"), ...this.Title.toArray(cryptInfo));
    }
    if (this.Author) {
      bytes.push(...encoder.encode("/Author"), ...this.Author.toArray(cryptInfo));
    }
    if (this.Subject) {
      bytes.push(...encoder.encode("/Subject"), ...this.Subject.toArray(cryptInfo));
    }
    if (this.Keywords) {
      bytes.push(...encoder.encode("/Keywords"), ...this.Keywords.toArray(cryptInfo));
    }
    if (this.Creator) {
      bytes.push(...encoder.encode("/Creator"), ...this.Creator.toArray(cryptInfo));
    }
    if (this.Producer) {
      bytes.push(...encoder.encode("/Producer"), ...this.Producer.toArray(cryptInfo));
    }
    if (this.CreationDate) {
      bytes.push(...encoder.encode("/CreationDate"), ...this.CreationDate.toArray(cryptInfo));
    }
    if (this.ModDate) {
      bytes.push(...encoder.encode("/ModDate"), ...this.ModDate.toArray(cryptInfo));
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }

  /**
   * fill public properties from data using info/parser if available
   */
  protected tryParseProps(parseInfo: ParseInfo): boolean {
    const superIsParsed = super.tryParseProps(parseInfo);
    if (!superIsParsed) {
      return false;
    }

    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end; 
    
    let i = parser.skipToNextName(start, end - 1);
    if (i === -1) {
      // no required props found
      return false;
    }
    let name: string;
    let parseResult: ParseResult<string>;
    while (true) {
      parseResult = parser.parseNameAt(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/Title":
            const title = LiteralString.parse(parser, i, parseInfo.cryptInfo);
            if (title) {
              this.Title = title.value;
              i = title.end + 1;
            } else {              
              throw new Error("Can't parse /Title property value");
            }
            break;
          case "/Author":
            const author = LiteralString.parse(parser, i, parseInfo.cryptInfo);
            if (author) {
              this.Author = author.value;
              i = author.end + 1;
            } else {              
              throw new Error("Can't parse /Author property value");
            }
            break;
          case "/Subject":
            const subject = LiteralString.parse(parser, i, parseInfo.cryptInfo);
            if (subject) {
              this.Subject = subject.value;
              i = subject.end + 1;
            } else {              
              throw new Error("Can't parse /Subject property value");
            }
            break;
          case "/Keywords":
            const keywords = LiteralString.parse(parser, i, parseInfo.cryptInfo);
            if (keywords) {
              this.Keywords = keywords.value;
              i = keywords.end + 1;
            } else {              
              throw new Error("Can't parse /Keywords property value");
            }
            break;
          case "/Creator":
            const creator = LiteralString.parse(parser, i, parseInfo.cryptInfo);
            if (creator) {
              this.Creator = creator.value;
              i = creator.end + 1;
            } else {              
              throw new Error("Can't parse /Creator property value");
            }
            break;
          case "/Producer":
            const producer = LiteralString.parse(parser, i, parseInfo.cryptInfo);
            if (producer) {
              this.Producer = producer.value;
              i = producer.end + 1;
            } else {              
              throw new Error("Can't parse /Producer property value");
            }
            break;
          case "/CreationDate":
            const creationDate = DateString.parse(parser, i, parseInfo.cryptInfo);
            if (creationDate) {
              this.CreationDate = creationDate.value;
              i = creationDate.end + 1;
            } else {              
              throw new Error("Can't parse /CreationDate property value");
            }
            break;
          case "/ModDate":
            const modDate = DateString.parse(parser, i, parseInfo.cryptInfo);
            if (modDate) {
              this.ModDate = modDate.value;
              i = modDate.end + 1;
            } else {              
              throw new Error("Can't parse /ModDate property value");
            }
            break;
          default:
            // skip to next name
            i = parser.skipToNextName(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };

    return true;
  }
}
