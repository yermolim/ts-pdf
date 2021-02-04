import { xRefTypes } from "../../common/const";
import { FlateDecoder } from "../../common/decoders/flate-decoder";
import { ParseInfo, ParseResult } from "../../parser/document-parser";
import { ObjectId } from "../common/object-id";
import { TrailerStream } from "./trailer-stream";
import { XRef } from "./x-ref";
import { XRefEntry } from "./x-ref-entry";

export class XRefStream extends XRef {
  private _trailerStream: TrailerStream;

  get prev(): number {
    return this._trailerStream?.Prev;
  }
  
  get size(): number {
    return this._trailerStream?.Size;
  }
  
  get root(): ObjectId {
    return this._trailerStream?.Root;
  }
  
  constructor(trailer: TrailerStream) {
    super(xRefTypes.STREAM);
    this._trailerStream = trailer;
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<XRefStream> {
    if (!parseInfo) {
      return null;
    }
    
    const trailerStream = TrailerStream.parse(parseInfo);   
    if (!trailerStream) {
      return null;
    }

    const xrefStream = new XRefStream(trailerStream.value);
  
    return {
      value: xrefStream,
      start: null,
      end: null,
    };
  }

  getEntries(): Iterable<XRefEntry> {   
    if (!this._trailerStream) {
      return [];
    }

    let decodedData: Uint8Array;
    if (this._trailerStream.DecodeParms) {
      const params = this._trailerStream.DecodeParms;
      decodedData = FlateDecoder.Decode(this._trailerStream.streamData,
        params.Predictor,
        params.Columns,
        params.Colors,
        params.BitsPerComponent); 
    } else {      
      decodedData = FlateDecoder.Decode(this._trailerStream.streamData);
    }

    const entries = XRefEntry.parseFromStream(decodedData, 
      this._trailerStream.W, this._trailerStream.Index);
    return entries;
  }
}
