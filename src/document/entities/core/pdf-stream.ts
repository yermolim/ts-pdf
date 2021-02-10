import { StreamFilter, StreamType, supportedFilters, valueTypes } from "../../common/const";
import { FlateParamsDict } from "../encoding/flate-params-dict";
import { Bounds, ParseInfo, ParseResult } from "../../parser/data-parser";
import { PdfObject } from "./pdf-object";
import { keywordCodes } from "../../common/codes";
import { FlateDecoder } from "../../common/decoders/flate-decoder";

export abstract class PdfStream extends PdfObject {
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
  Filter: StreamFilter; // | StreamFilter[]; TODO: Add support to filter arrays
  /**
   * (Optional) A parameter dictionary or an array of such dictionaries, 
   * used by the filters specified by Filter
   */
  DecodeParms: FlateParamsDict; // | Dict | (Dict | FlateParamsDict)[];
  /**
   * (Optional; PDF 1.5+) A non-negative integer representing the number of bytes 
   * in the decoded (defiltered) stream. It can be used to determine, for example, 
   * whether enough disk space is available to write a stream to a file
   */
  DL: number;
  
  protected _streamData: Uint8Array;
  get streamData(): Uint8Array {
    return this._streamData;
  }
  set streamData(data: Uint8Array) { 
    let encodedData: Uint8Array;   
    if (this.DecodeParms) {
      const params = this.DecodeParms;
      encodedData = FlateDecoder.Encode(data,
        params.Predictor,
        params.Columns,
        params.Colors,
        params.BitsPerComponent); 
    } else {      
      encodedData = FlateDecoder.Encode(data);
    }
    this._streamData = encodedData;
    this.Length = encodedData.length;
    this.DL = data.length;
  }
  get decodedStreamData(): Uint8Array {
    let decodedData: Uint8Array;
    if (this.DecodeParms) {
      const params = this.DecodeParms;
      decodedData = FlateDecoder.Decode(this._streamData,
        params.Predictor,
        params.Columns,
        params.Colors,
        params.BitsPerComponent); 
    } else {      
      decodedData = FlateDecoder.Decode(this._streamData);
    }
    return decodedData;
  }
  
  protected constructor(type: StreamType = null) {
    super();
    this.Type = type;
  }  

  toArray(): Uint8Array {
    const encoder = new TextEncoder();
    const bytes: number[] = [...keywordCodes.DICT_START];
    
    if (this.Type) {
      bytes.push(...keywordCodes.TYPE, ...encoder.encode(this.Type));
    }
    if (this.Length) {
      bytes.push(...encoder.encode("/Length"), ...encoder.encode(" " + this.Length));
    }
    if (this.Filter) {
      bytes.push(...encoder.encode("/Filter"), ...encoder.encode(this.Filter));
    }
    if (this.DecodeParms) {
      bytes.push(...encoder.encode("/DecodeParms"), ...this.DecodeParms.toArray());
    }
    bytes.push(    
      ...keywordCodes.DICT_END, ...keywordCodes.END_OF_LINE,
      ...keywordCodes.STREAM_START, ...keywordCodes.END_OF_LINE,
      ...this.streamData, ...keywordCodes.END_OF_LINE,
      ...keywordCodes.STREAM_END, ...keywordCodes.END_OF_LINE
    );

    return new Uint8Array(bytes);
  }

  /**
   * try parse and fill public properties from data using info/parser if available
   */
  protected tryParseProps(parseInfo: ParseInfo): boolean {
    if (!parseInfo) {
      return false;
    }

    this._id = parseInfo.id;
    this._generation = parseInfo.generation;

    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end;  

    const streamEndIndex = parser.findSubarrayIndex(keywordCodes.STREAM_END, { 
      direction: "reverse", 
      minIndex: start, 
      maxIndex: end, 
      closedOnly: true
    });
    if (!streamEndIndex) {
      // this is not a stream object
      return false;
    }   
    const streamStartIndex = parser.findSubarrayIndex(keywordCodes.STREAM_START, {
      direction: "reverse", 
      minIndex: start,
      maxIndex: streamEndIndex.start - 1, 
      closedOnly: true
    });
    if (!streamStartIndex) {
      // stream start is out of bounds
      return false;
    }   
    
    const dictBounds = parser.getDictBoundsAt(start);
    let i = parser.skipToNextName(dictBounds.contentStart, dictBounds.contentEnd);
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
          case "/Type":
            const type = parser.parseNameAt(i);
            if (type) {
              if (this.Type && this.Type !== type.value) {
                // wrong object type
                return false;
              }
              i = type.end + 1;
            } else {
              throw new Error("Can't parse /Type property value");
            }
            break;
          case "/Length":
            const length = parser.parseNumberAt(i, false);
            if (length) {
              this.Length = length.value;
              i = length.end + 1;
            } else {              
              throw new Error("Can't parse /Length property value");
            }
            break;
          case "/Filter":
            const entryType = parser.getValueTypeAt(i);
            if (entryType === valueTypes.NAME) {  
              const filter = parser.parseNameAt(i);  
              if (filter && supportedFilters.has(filter.value)) {
                this.Filter = <StreamFilter>filter.value;
                i = filter.end + 1;
                break;
              } else {              
                throw new Error(`Unsupported /Filter property value: ${filter.value}`);
              }
            } else if (entryType === valueTypes.ARRAY) {              
              const filterNames = parser.parseNameArrayAt(i);
              if (filterNames) {
                const filterArray = filterNames.value;
                if (filterArray.length === 1 && supportedFilters.has(filterArray[0])) {
                  this.Filter = <StreamFilter>filterArray[0];
                  i = filterNames.end + 1;
                  break;
                } else {                  
                  throw new Error(`Unsupported /Filter property value: ${filterArray.toString()}`);
                }
              }
            }
            throw new Error(`Unsupported /Filter property value type: ${entryType}`);
          case "/DecodeParms":
            // TODO: add support for decode params arrays
            const decodeParamsBounds = parser.getDictBoundsAt(i);
            if (decodeParamsBounds) {
              const params = FlateParamsDict.parse({parser, bounds: decodeParamsBounds});
              if (params) {
                this.DecodeParms = params.value;
              }
              i = decodeParamsBounds.end + 1;
            } else {              
              throw new Error("Can't parse /DecodeParms property value");
            }
            break;
          case "/DL":
            const dl = parser.parseNumberAt(i, false);
            if (dl) {
              this.DL = dl.value;
              i = dl.end + 1;
            } else {              
              throw new Error("Can't parse /DL property value");
            }
            break;
          default:
            // skip value to next name
            i = parser.skipToNextName(i, dictBounds.contentEnd);
            break;
        }
      } else {
        break;
      }
    };
    
    const streamStart = parser.findNewLineIndex("straight", streamStartIndex.end + 1);
    const streamEnd = parser.findNewLineIndex("reverse", streamEndIndex.start - 1);
    const encodedData = parser.sliceCharCodes(streamStart, streamEnd);
    if (!this.Length || this.Length !== encodedData.length) {    
      // TODO: replace error with 'return false;' after assuring that the code works correctly
      throw new Error("Incorrect stream length");
    }   
    this._streamData = encodedData;

    return true;
  }
}
