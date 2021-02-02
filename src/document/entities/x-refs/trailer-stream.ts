import { dictObjTypes, StreamFilter, supportedFilters } from "../../common/const";
import { HexString } from "../../common/hex-string";
import { Parser, ParseResult } from "../../parser";
import { ObjId } from "../core/obj-id";
import { ObjInfo } from "../core/obj-info";
import { EncryptionDict } from "../encryption/encryption-dict";
import { StreamDict } from "../streams/stream-dict";
import { CatalogDict } from "../structure/catalog-dict";
import { InfoDict } from "../structure/info-dict";

export class TrailerStream extends StreamDict {
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
  Root: ObjId | CatalogDict;
  /**
   * (Required if document is encrypted; PDF 1.1+) 
   * The document’s encryption dictionary
   */
  Encrypt: ObjId | EncryptionDict;
  /**
   * (Optional; shall be an indirect reference) 
   * The document’s information dictionary
   */
  Info: ObjId | InfoDict;
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
  
  constructor() {
    super(dictObjTypes.XREF);
  }  
  
  static parse(parser: Parser, info: ObjInfo): ParseResult<TrailerStream> {    
    if (!parser || !info) {
      return null;
    }
    const trailer = new TrailerStream();
    trailer.id = info.id;

    let i = info.dictStart;
    let name: string;
    let parseResult: ParseResult<string>;
    while (true) {
      parseResult = parser.parseNameAtIndex(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        console.log(name);
        switch (name) {
          case "/Type":
            const type = parser.parseNameAtIndex(i);
            if (type && type.value === dictObjTypes.XREF) {
              i = type.end + 1;
            } else {              
              // it's not a trailer stream
              return null;
            }
            break;
          case "/Length":
            const length = parser.parseNumberAtIndex(i, false);
            if (length) {
              trailer.Length = length.value;
              i = length.end + 1;
            } else {              
              throw new Error("Can't parse /Length property value");
            }
            break;
          case "/Filter":
            // TODO: add support for filter arrays
            const filter = parser.parseNameAtIndex(i);
            if (filter && supportedFilters.has(filter.value)) {
              trailer.Filter = <StreamFilter>filter.value;
              i = filter.end + 1;
            } else {              
              throw new Error("Unsupported /Filter property value");
            }
            break;
          case "/DecodeParams":
            // TODO: implement
            const decodeParamsBounds = parser.getDictBoundsAtIndex(i);
            if (decodeParamsBounds) {
              console.log(decodeParamsBounds);
              i = decodeParamsBounds.end + 1;
            } else {              
              throw new Error("Can't parse /DecodeParams property value");
            }
            break;
          case "/DL":
            const dl = parser.parseNumberAtIndex(i, false);
            if (dl) {
              trailer.Size = dl.value;
              i = dl.end + 1;
            } else {              
              throw new Error("Can't parse /DL property value");
            }
            break;
          case "/Size":
            const size = parser.parseNumberAtIndex(i, false);
            if (size) {
              trailer.Size = size.value;
              i = size.end + 1;
            } else {              
              throw new Error("Can't parse /Size property value");
            }
            break;
          case "/Prev":
            const prev = parser.parseNumberAtIndex(i, false);
            if (prev) {
              trailer.Prev = prev.value;
              i = prev.end + 1;
            } else {              
              throw new Error("Can't parse /Size property value");
            }
            break;
          case "/Root":
            const rootId = ObjId.parseRef(parser, i);
            if (rootId) {
              trailer.Root = rootId.value;
              i = rootId.end + 1;
            } else {              
              throw new Error("Can't parse /Root property value");
            }
            break;
          case "/Encrypt":
            // TODO: add direct encrypt object support
            const encryptId = ObjId.parseRef(parser, i);
            if (encryptId) {
              trailer.Encrypt = encryptId.value;
              i = encryptId.end + 1;
            } else {              
              throw new Error("Can't parse /Ebcrypt property value");
            }
            break;
          case "/Info":
            const infoId = ObjId.parseRef(parser, i);
            if (infoId) {
              trailer.Info = infoId.value;
              i = infoId.end + 1;
            } else {              
              throw new Error("Can't parse /Info property value");
            }
            break;
          case "/ID":
            const ids = parser.parseHexArrayAtIndex(i);
            if (ids) {
              trailer.ID = [ids.value[0], ids.value[1]];
              i = ids.end + 1;
            } else {              
              throw new Error("Can't parse /ID property value");
            }
            break;
          case "/Index":
            const index = parser.parseNumberArrayAtIndex(i);
            if (index) {
              trailer.Index = index.value;
              i = index.end + 1;
            } else {              
              throw new Error("Can't parse /Index property value");
            }
            break;
          case "/W":
            const w = parser.parseNumberArrayAtIndex(i);
            if (w) {
              trailer.W = [w.value[0], w.value[1], w.value[2]];
              i = w.end + 1;
            } else {              
              throw new Error("Can't parse /W property value");
            }
            break;
          default:
            break;
        }
      } else {
        console.log(trailer);
        break;
      }
    };

    return {
      value: trailer,
      start: info.start,
      end: info.end,
    };
  }
}
