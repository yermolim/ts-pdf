import { dictTypes, streamTypes } from "../../common/const";
import { HexString } from "../common/hex-string";
import { Bounds, DocumentParser, ParseResult } from "../../document-parser";
import { ObjectId } from "../common/object-id";
import { EncryptionDict } from "../encryption/encryption-dict";
import { PdfStream } from "../core/pdf-stream";

export class TrailerStream extends PdfStream {
  /**
   * (Required) The number one greater than the highest object number 
   * used in this section or in any section for which this shall be an update. 
   * It shall be equivalent to the Size entry in a trailer dictionary
   */
  Size: number;
  /**
   * (Present only if the file has more than one cross-reference stream; 
   * not meaningful in hybrid-reference files) 
   * The byte offset in the decoded stream from the beginning of the file 
   * to the beginning of the previous cross-reference stream. 
   * This entry has the same function as the Prev entry in the trailer dictionary
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
  Encrypt: ObjectId | EncryptionDict;
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
  ID: [HexString, HexString];
  /**
   * (Optional) An array containing a pair of integers for each subsection 
   * in this section. The first integer shall be the first object number 
   * in the subsection; the second integer shall be the number of entries 
   * in the subsection The array shall be sorted in ascending order by object number. 
   * Subsections cannot overlap; 
   * an object number may have at most one entry in a section
   */
  Index: number[];
  /**
   * (Required) An array of integers representing the size of the fields 
   * in a single cross-reference entry. 
   * For PDF 1.5+, W always contains three integers; the value of each integer 
   * shall be the number of bytes (in the decoded stream) of the corresponding field
   */
  W: [type: number, value1: number, value2: number];
  
  constructor() {
    super(streamTypes.XREF);
  }  
  
  static parse(parser: DocumentParser, bounds: Bounds): ParseResult<TrailerStream> {    
    const trailer = new TrailerStream();
    const parseResult = trailer.tryParseProps(parser, bounds);

    return parseResult
      ? {value: trailer, start: bounds.start, end: bounds.end}
      : null;
  }

  toArray(): Uint8Array {
    return new Uint8Array();
  }

  /**
   * fill public properties from data using info/parser if available
   */
  protected tryParseProps(parser: DocumentParser, bounds: Bounds): boolean {
    const superIsParsed = super.tryParseProps(parser, bounds);
    if (!superIsParsed) {
      return false;
    }

    if (this.Type !== dictTypes.XREF) {
      return false;
    }

    const start = bounds.contentStart || bounds.start;
    const dictBounds = parser.getDictBoundsAt(start);
    
    let i = parser.skipToNextName(start, dictBounds.contentEnd);
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
              throw new Error("Can't parse /Encrypt property value");
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
          case "/ID":
            const ids = parser.parseHexArrayAt(i);
            if (ids) {
              this.ID = [ids.value[0], ids.value[1]];
              i = ids.end + 1;
            } else {              
              throw new Error("Can't parse /ID property value");
            }
            break;
          case "/Index":
            const index = parser.parseNumberArrayAt(i);
            if (index) {
              this.Index = index.value;
              i = index.end + 1;
            } else {              
              throw new Error("Can't parse /Index property value");
            }
            break;
          case "/W":
            const w = parser.parseNumberArrayAt(i);
            if (w) {
              this.W = [w.value[0], w.value[1], w.value[2]];
              i = w.end + 1;
            } else {              
              throw new Error("Can't parse /W property value");
            }
            break;
          default:
            // skip to next name
            i = parser.skipToNextName(i, dictBounds.contentEnd);
            break;
        }
      } else {
        break;
      }
    };

    return true;
  }
}
