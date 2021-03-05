import { FlatePredictor, flatePredictors, StreamFilter, 
  streamFilters, StreamType, supportedFilters, valueTypes } from "../../const";
import { DecodeParamsDict } from "../encoding/decode-params-dict";
import { ParseInfo, ParseResult } from "../../data-parser";
import { PdfObject } from "./pdf-object";
import { keywordCodes } from "../../codes";
import { FlateDecoder } from "../../encoding/flate-decoder";
import { CryptInfo } from "../../common-interfaces";

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
  DecodeParms: DecodeParamsDict; // | Dict | (Dict | FlateParamsDict)[];
  /**
   * (Optional; PDF 1.5+) A non-negative integer representing the number of bytes 
   * in the decoded (defiltered) stream. It can be used to determine, for example, 
   * whether enough disk space is available to write a stream to a file
   */
  DL: number;
  
  protected _streamData: Uint8Array;
  protected _decodedStreamData: Uint8Array;
  get streamData(): Uint8Array {
    return this._streamData;
  }
  set streamData(data: Uint8Array) { 
    this.setStreamData(data);
  }
  get decodedStreamData(): Uint8Array {
    if (!this._decodedStreamData) {
      this.decodeStreamData();
    }
    return this._decodedStreamData;
  }
  
  protected constructor(type: StreamType) {
    super();
    this.Type = type;
  }  

  toArray(cryptInfo?: CryptInfo): Uint8Array {
    
    const streamData = cryptInfo?.ref && cryptInfo.streamCryptor
      ? cryptInfo.streamCryptor.encrypt(this.streamData, cryptInfo.ref)
      : this.streamData; 
    
    const encoder = new TextEncoder();
    const bytes: number[] = [...keywordCodes.DICT_START];
    bytes.push(...encoder.encode("/Length "), ...encoder.encode(" " + streamData.length));
    if (this.Type) {
      bytes.push(...keywordCodes.TYPE, ...encoder.encode(this.Type));
    }
    if (this.Filter) {
      bytes.push(...encoder.encode("/Filter "), ...encoder.encode(this.Filter));
    }
    if (this.DecodeParms) {
      bytes.push(...encoder.encode("/DecodeParms "), ...this.DecodeParms.toArray(cryptInfo));
    } 
    bytes.push(    
      ...keywordCodes.DICT_END, ...keywordCodes.END_OF_LINE,
      ...keywordCodes.STREAM_START, ...keywordCodes.END_OF_LINE,
      ...streamData, ...keywordCodes.END_OF_LINE,
      ...keywordCodes.STREAM_END, ...keywordCodes.END_OF_LINE
    );

    return new Uint8Array(bytes);
  }

  /**
   * try parse and fill public properties from data using info/parser if available
   */
  protected parseProps(parseInfo: ParseInfo) {
    if (!parseInfo) {
      throw new Error("Parse info is empty");
    }

    this._ref = parseInfo.cryptInfo?.ref;

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
      throw new Error("Object is not a stream");
    }   
    const streamStartIndex = parser.findSubarrayIndex(keywordCodes.STREAM_START, {
      direction: "reverse", 
      minIndex: start,
      maxIndex: streamEndIndex.start - 1, 
      closedOnly: true
    });
    if (!streamStartIndex) {
      throw new Error("Stream start is out of the data bounds");
    }   
    
    const dictBounds = parser.getDictBoundsAt(start);
    let i = parser.skipToNextName(dictBounds.contentStart, dictBounds.contentEnd);
    if (i === -1) {
      throw new Error("Dict is empty (has no properties)");
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
                throw new Error(`Ivalid dict type: '${type.value}' instead of '${this.Type}'`);
              }
              i = type.end + 1;
            } else {
              throw new Error("Can't parse /Type property value");
            }
            break;
          
          case "/Length":
          case "/DL":
            i = this.parseNumberProp(name, parser, i, false);
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
                // TODO: add support for multiple filters
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
            const paramsEntryType = parser.getValueTypeAt(i);
            if (paramsEntryType === valueTypes.DICTIONARY) {  
              const decodeParamsBounds = parser.getDictBoundsAt(i);
              if (decodeParamsBounds) {
                const params = DecodeParamsDict.parse({parser, 
                  bounds: decodeParamsBounds, cryptInfo: parseInfo.cryptInfo});
                if (params) {
                  this.DecodeParms = params.value;
                  i = decodeParamsBounds.end + 1;
                  break;
                }
              }              
              throw new Error("Can't parse /DecodeParms property value");
            } else if (paramsEntryType === valueTypes.ARRAY) {               
              const paramsDicts = DecodeParamsDict.parseArray(parser, i, parseInfo.cryptInfo);
              if (paramsDicts) {
                const paramsArray = paramsDicts.value;
                // TODO: add support for multiple filters
                if (paramsArray.length === 1) {
                  this.DecodeParms = paramsArray[0];
                  i = paramsDicts.end + 1;
                  break;
                }
              }
              throw new Error("Can't parse /DecodeParms property value");
            }
            throw new Error(`Unsupported /DecodeParms property value type: ${paramsEntryType}`);      

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
    const streamBytes = parser.sliceCharCodes(streamStart, streamEnd);
    const encodedData = parseInfo.cryptInfo?.ref && parseInfo.cryptInfo.streamCryptor
      ? parseInfo.cryptInfo.streamCryptor.decrypt(streamBytes, parseInfo.cryptInfo.ref)
      : streamBytes;
    this._streamData = encodedData;
  }

  protected setStreamData(data: Uint8Array) {
    let encodedData: Uint8Array;   
    if (this.DecodeParms) {
      const params = this.DecodeParms;
      encodedData = FlateDecoder.Encode(data,
        <FlatePredictor>params.getIntProp("/Predictor") || flatePredictors.NONE,
        params.getIntProp("/Columns") || 1,
        params.getIntProp("/Colors") || 1,
        params.getIntProp("/BitsPerComponent") || 8); 
    } else {      
      encodedData = FlateDecoder.Encode(data);
    }
    this._streamData = encodedData;
    this.Length = encodedData.length;
    this.DL = data.length;
    this._decodedStreamData = data;
  }

  protected decodeStreamData() {    
    let decodedData: Uint8Array;

    switch (this.Filter) {
      case streamFilters.FLATE:
        if (this.DecodeParms) {
          const params = this.DecodeParms;
          decodedData = FlateDecoder.Decode(this._streamData,
            <FlatePredictor>params.getIntProp("/Predictor") || flatePredictors.NONE,
            params.getIntProp("/Columns") || 1,
            params.getIntProp("/Colors") || 1,
            params.getIntProp("/BitsPerComponent") || 8); 
        } else {      
          decodedData = FlateDecoder.Decode(this._streamData);
        }
        break;
      default:
        decodedData = new Uint8Array(this._streamData);
        break;
    }

    this._decodedStreamData = decodedData;
  }
}
