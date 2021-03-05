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
    const parseResult = info.parseProps(parseInfo);

    return parseResult
      ? {value: info, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }  
   
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.Title) {
      bytes.push(...encoder.encode("/Title "), ...this.Title.toArray(cryptInfo));
    }
    if (this.Author) {
      bytes.push(...encoder.encode("/Author "), ...this.Author.toArray(cryptInfo));
    }
    if (this.Subject) {
      bytes.push(...encoder.encode("/Subject "), ...this.Subject.toArray(cryptInfo));
    }
    if (this.Keywords) {
      bytes.push(...encoder.encode("/Keywords "), ...this.Keywords.toArray(cryptInfo));
    }
    if (this.Creator) {
      bytes.push(...encoder.encode("/Creator "), ...this.Creator.toArray(cryptInfo));
    }
    if (this.Producer) {
      bytes.push(...encoder.encode("/Producer "), ...this.Producer.toArray(cryptInfo));
    }
    if (this.CreationDate) {
      bytes.push(...encoder.encode("/CreationDate "), ...this.CreationDate.toArray(cryptInfo));
    }
    if (this.ModDate) {
      bytes.push(...encoder.encode("/ModDate "), ...this.ModDate.toArray(cryptInfo));
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
  protected parseProps(parseInfo: ParseInfo): boolean {
    const superIsParsed = super.parseProps(parseInfo);
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
          case "/Author":
          case "/Subject": 
          case "/Keywords": 
          case "/Creator": 
          case "/Producer":        
            i = this.parseLiteralProp(name, parser, i, parseInfo.cryptInfo);
            break;

          case "/CreationDate": 
          case "/ModDate":           
            i = this.parseDateProp(name, parser, i, parseInfo.cryptInfo);
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
