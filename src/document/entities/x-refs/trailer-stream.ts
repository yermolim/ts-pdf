import { dictTypes, objectTypes, StreamFilter, supportedFilters } from "../../common/const";
import { HexString } from "../../common/hex-string";
import { Parser, ParseResult } from "../../parser";
import { IndirectObjectId } from "../core/indirect-object-id";
import { IndirectObjectParseInfo } from "../core/indirect-object-parse-info";
import { EncryptionDict } from "../encryption/encryption-dict";
import { Stream } from "../core/stream";
import { CatalogDict } from "../structure/catalog-dict";
import { InfoDict } from "../structure/info-dict";
import { codes } from "../../common/codes";

export class TrailerStream extends Stream {
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
  Root: IndirectObjectId;
  /**
   * (Required if document is encrypted; PDF 1.1+) 
   * The document’s encryption dictionary
   */
  Encrypt: IndirectObjectId | EncryptionDict;
  /**
   * (Optional; shall be an indirect reference) 
   * The document’s information dictionary
   */
  Info: IndirectObjectId;
  /**
   * (Required if an Encrypt entry is present; optional otherwise; PDF 1.1+) 
   * An array of two byte-strings constituting a file identifier for the file. 
   * If there is an Encrypt entry this array and the two byte-strings 
   * shall be direct objects and shall be unencrypted
   */
  ID: [HexString, HexString];
  /**
   * (Optional)An array containing a pair of integers for each subsection 
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
  W: [number, number, number];
  
  constructor(parseInfo?: IndirectObjectParseInfo) {
    super(parseInfo, dictTypes.XREF);
  }  
  
  static parse(info: IndirectObjectParseInfo): ParseResult<TrailerStream> {    
    const trailer = new TrailerStream(info);
    const parseResult = trailer.tryParseProps();

    return parseResult
      ? {value: trailer, start: info.start, end: info.end}
      : null;
  }

  toArray(): Uint8Array {
    return new Uint8Array();
  }

  /**
   * fill public properties from data using info/parser if available
   */
  protected tryParseProps(): boolean {
    const superIsParsed = super.tryParseProps();
    if (!superIsParsed) {
      return false;
    }

    if (this.Type !== dictTypes.XREF) {
      return false;
    }
    
    const info = this.parseInfo;
    let i = info.dictStart;
    let name: string;
    let parseResult: ParseResult<string>;
    while (true) {
      parseResult = info.parser.parseNameAt(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/Size":
            const size = info.parser.parseNumberAt(i, false);
            if (size) {
              this.Size = size.value;
              i = size.end + 1;
            } else {              
              throw new Error("Can't parse /Size property value");
            }
            break;
          case "/Prev":
            const prev = info.parser.parseNumberAt(i, false);
            if (prev) {
              this.Prev = prev.value;
              i = prev.end + 1;
            } else {              
              throw new Error("Can't parse /Size property value");
            }
            break;
          case "/Root":
            const rootId = IndirectObjectId.parseRef(info.parser, i);
            if (rootId) {
              this.Root = rootId.value;
              i = rootId.end + 1;
            } else {              
              throw new Error("Can't parse /Root property value");
            }
            break;
          case "/Encrypt":
            // TODO: add direct encrypt object support
            const encryptId = IndirectObjectId.parseRef(info.parser, i);
            if (encryptId) {
              this.Encrypt = encryptId.value;
              i = encryptId.end + 1;
            } else {              
              throw new Error("Can't parse /Ebcrypt property value");
            }
            break;
          case "/Info":
            const infoId = IndirectObjectId.parseRef(info.parser, i);
            if (infoId) {
              this.Info = infoId.value;
              i = infoId.end + 1;
            } else {              
              throw new Error("Can't parse /Info property value");
            }
            break;
          case "/ID":
            const ids = info.parser.parseHexArrayAt(i);
            if (ids) {
              this.ID = [ids.value[0], ids.value[1]];
              i = ids.end + 1;
            } else {              
              throw new Error("Can't parse /ID property value");
            }
            break;
          case "/Index":
            const index = info.parser.parseNumberArrayAt(i);
            if (index) {
              this.Index = index.value;
              i = index.end + 1;
            } else {              
              throw new Error("Can't parse /Index property value");
            }
            break;
          case "/W":
            const w = info.parser.parseNumberArrayAt(i);
            if (w) {
              this.W = [w.value[0], w.value[1], w.value[2]];
              i = w.end + 1;
            } else {              
              throw new Error("Can't parse /W property value");
            }
            break;
          default:
            // skip to next name
            i = info.parser.skipToNextName(i, info.dictEnd);
            break;
        }
      } else {
        return true;
      }
    };
  }
}
