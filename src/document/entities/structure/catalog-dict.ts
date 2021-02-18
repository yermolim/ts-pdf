import { codes } from "../../codes";
import { dictTypes } from "../../const";
import { CryptInfo } from "../../interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { LiteralString } from "../common/literal-string";
import { ObjectId } from "../common/object-id";
import { PdfDict } from "../core/pdf-dict";

export class CatalogDict extends PdfDict {
  /**
   * (Optional; PDF 1.4+) The version of the PDF specification 
   * to which the document conforms if later than the version 
   * specified in the file’s header. If the header specifies a later version, 
   * or if this entry is absent, the document shall conform to the version 
   * specified in the header. This entry enables a conforming writer 
   * to update the version using an incremental update; 
   * The value of this entry shall be a name object, not a number, 
   * and therefore shall be preceded by a SOLIDUS (2Fh) character (/) 
   * when written in the PDF file (for example, /1.4)
   */
  Version: string;
  /**
   * (Required; shall be an indirect reference) 
   * The page tree node that shall be the root of the document’s page tree
   */
  Pages: ObjectId;
  /**
   * (Optional; PDF 1.4+) A language identifier that shall specify the natural language 
   * for all text in the document except where overridden by language specifications 
   * for structure elements or marked content. If this entry is absent, 
   * the language shall be considered unknown
   */
  Lang: LiteralString;

  // TODO: Add other properties
  
  constructor() {
    super(dictTypes.CATALOG);
  }  
  
  static parse(parseInfo: ParseInfo): ParseResult<CatalogDict> {    
    const catalog = new CatalogDict();
    const parseResult = catalog.tryParseProps(parseInfo);

    return parseResult
      ? {value: catalog, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }

  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray();  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.Version) {
      bytes.push(...encoder.encode("/Version"), ...encoder.encode(this.Version));
    }
    if (this.Pages) {
      bytes.push(...encoder.encode("/Pages"), codes.WHITESPACE, ...this.Pages.toArray());
    }
    if (this.Lang) {
      bytes.push(...encoder.encode("/Lang"), ...this.Lang.toArray());
    }

    // TODO: handle remaining properties

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
          case "/Version":
            const version = parser.parseNameAt(i, false, false);
            if (version) {
              this.Version = version.value;
              i = version.end + 1;
            } else {              
              throw new Error("Can't parse /Version property value");
            }
            break;
          case "/Pages":
            const rootPageTreeId = ObjectId.parseRef(parser, i);
            if (rootPageTreeId) {
              this.Pages = rootPageTreeId.value;
              i = rootPageTreeId.end + 1;
            } else {              
              throw new Error("Can't parse /Pages property value");
            }
            break;
          case "/Lang":
            const lang = LiteralString.parse(parser, i);
            if (lang) {
              this.Lang = lang.value;
              i = lang.end + 1;
            } else {              
              throw new Error("Can't parse /Lang property value");
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
    
    if (!this.Pages) {
      // not all required properties parsed
      return false;
    }    

    return true;
  }
}
