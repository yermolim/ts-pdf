import { dictTypes, objectTypes, StreamFilter, StreamType, supportedFilters } from "../../common/const";
import { Dict } from "./dict";
import { FlateParamsDict } from "../encoding/flate-params-dict";
import { IndirectStreamObject } from "./indirect-object";
import { IndirectObjectParseInfo } from "./indirect-object-parse-info";
import { ParseResult } from "../../parser";
import { IndirectObjectId } from "./indirect-object-id";

export abstract class Stream extends IndirectStreamObject {
  /** (Optional) The  type  of  PDF  object  that  this  dictionary  describes */
  readonly Type: StreamType;

  /**
   * (Required) The number of bytes from the beginning of the line 
   * following the keyword stream to the last byte just before the keyword endstream. 
   * (There may be an additional EOL marker, preceding endstream, 
   * that is not included in the count and is not logically part of the stream data.
   */
  Length: number;
  /**
   * (Optional) The name of a filter that shall be applied in processing the stream data 
   * found between the keywords stream and endstream, or an array of zero, one or several names. 
   * Multiple filters shall be specified in the order in which they are to be applied
   */
  Filter: StreamFilter | StreamFilter[];
  /**
   * (Optional) A parameter dictionary or an array of such dictionaries, 
   * used by the filters specified by Filter
   */
  DecodeParms: (Dict | FlateParamsDict)[] | Dict | FlateParamsDict;
  /**
   * (Optional; PDF 1.5+) A non-negative integer representing the number of bytes 
   * in the decoded (defiltered) stream. It can be used to determine, for example, 
   * whether enough disk space is available to write a stream to a file
   */
  DL: number;
  
  protected constructor(parseInfo: IndirectObjectParseInfo = null, 
    type: StreamType = null) {
    super(parseInfo);
    this.Type = type;
  }

  decode(): Uint8Array {
    return new Uint8Array();
  }

  /**
   * try parse and fill public properties from data using info/parser if available
   */
  protected tryParseProps(): boolean {
    const info = this.parseInfo;
    if (!info || !info.parser || info.type !== objectTypes.STREAM) {
      return false;
    }
    
    let i = info.dictStart;
    let name: string;
    let parseResult: ParseResult<string>;
    while (true) {
      parseResult = info.parser.parseNameAt(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/Type":
            const type = info.parser.parseNameAt(i);
            if (type) {
              i = type.end + 1;
            } else {
              throw new Error("Can't parse /Type property value");
            }
            break;
          case "/Length":
            const length = info.parser.parseNumberAt(i, false);
            if (length) {
              this.Length = length.value;
              i = length.end + 1;
            } else {              
              throw new Error("Can't parse /Length property value");
            }
            break;
          case "/Filter":
            // TODO: add support for filter arrays
            const filter = info.parser.parseNameAt(i);
            if (filter && supportedFilters.has(filter.value)) {
              this.Filter = <StreamFilter>filter.value;
              i = filter.end + 1;
            } else {              
              throw new Error("Unsupported /Filter property value");
            }
            break;
          case "/DecodeParms":
            // TODO: add support for decode params arrays
            const decodeParamsBounds = info.parser.getDictBoundsAt(i);
            if (decodeParamsBounds) {
              const params = FlateParamsDict.parse(info.parser, 
                decodeParamsBounds.start, decodeParamsBounds.end);
              if (params) {
                this.DecodeParms = params.value;
              }
              i = decodeParamsBounds.end + 1;
            } else {              
              throw new Error("Can't parse /DecodeParms property value");
            }
            break;
          case "/DL":
            const dl = info.parser.parseNumberAt(i, false);
            if (dl) {
              this.DL = dl.value;
              i = dl.end + 1;
            } else {              
              throw new Error("Can't parse /DL property value");
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
