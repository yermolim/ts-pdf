import { dictTypes } from "../../common/const";
import { Bounds, Parser, ParseResult } from "../../parser";
import { PdfDict } from "../core/pdf-dict";
import { ObjectId } from "../core/object-id";
import { EncryptionDict } from "../encryption/encryption-dict";
import { CatalogDict } from "../structure/catalog-dict";
import { InfoDict } from "../structure/info-dict";

export class TrailerDict extends PdfDict {
  /**
   * (Required; shall not be an indirect reference) 
   * The total number of entries in the file’s cross-reference table, 
   * as defined by the combination of the original section and all update sections. 
   * Equivalently, this value shall be 1 greater than the highest object number 
   * defined in the file. Any object in a cross-reference section 
   * whose number is greater than this value shall be ignored and
   * defined to be missing by a conforming reader
   */
  Size: number;
  /**
   * (Present only if the file has more than one cross-reference section; 
   * shall be an indirect reference) The byte offset in the decoded stream 
   * from the beginning of the file to the beginning 
   * of the previous cross-reference section
   */
  Prev: number;
  /**
   * (Required; shall be an indirect reference) The catalog dictionary 
   * for the PDF document contained in the file
   */
  Root: ObjectId;
  /**
   * (Required if document is encrypted; PDF 1.1+) 
   * The document’s encryption dictionary
   */
  Encrypt: ObjectId;
  /**
   * (Optional; shall be an indirect reference) 
   * The document’s information dictionary
   */
  Info: ObjectId;
  /**
   * (Required if an Encrypt entry is present; optional otherwise; PDF 1.1+) 
   * An array of two byte-strings constituting a file identifier for the file. 
   * If there is an Encrypt entry this array and the two byte-strings 
   * shall be direct objects and shall be unencrypted
   */
  ID: [];
  
  constructor() {
    super(dictTypes.EMPTY);
  }
  
  static parse(parser: Parser, bounds: Bounds): ParseResult<TrailerDict> {    
    const trailer = new TrailerDict();
    const parseResult = trailer.tryParseProps(parser, bounds);

    return parseResult
      ? {value: trailer, start: bounds.start, end: bounds.end}
      : null;
  }
  
  /**
   * fill public properties from data using info/parser if available
   */
  protected tryParseProps(parser: Parser, bounds: Bounds): boolean {
    const superIsParsed = super.tryParseProps(parser, bounds);
    if (!superIsParsed) {
      return false;
    }

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
          case "/Size":
            const size = parser.parseNumberAt(i, false);
            if (size) {
              this.Size = size.value;
              i = size.end + 1;
            } else {              
              throw new Error("Can't parse /Size property value");
            }
            break;
          case "/Prev":
            const prev = parser.parseNumberAt(i, false);
            if (prev) {
              this.Prev = prev.value;
              i = prev.end + 1;
            } else {              
              throw new Error("Can't parse /Size property value");
            }
            break;
          case "/Root":
            const rootId = ObjectId.parseRef(parser, i);
            if (rootId) {
              this.Root = rootId.value;
              i = rootId.end + 1;
            } else {              
              throw new Error("Can't parse /Root property value");
            }
            break;
          case "/Encrypt":
            // TODO: add direct encrypt object support
            const encryptId = ObjectId.parseRef(parser, i);
            if (encryptId) {
              this.Encrypt = encryptId.value;
              i = encryptId.end + 1;
            } else {              
              throw new Error("Can't parse /Ebcrypt property value");
            }
            break;
          case "/Info":
            const infoId = ObjectId.parseRef(parser, i);
            if (infoId) {
              this.Info = infoId.value;
              i = infoId.end + 1;
            } else {              
              throw new Error("Can't parse /Info property value");
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
