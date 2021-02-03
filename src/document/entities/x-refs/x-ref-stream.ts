import { xRefTypes } from "../../common/const";
import { FlateDecoder } from "../../common/decoders/flate-decoder";
import { Bounds, Parser, ParseResult } from "../../parser";
import { TrailerStream } from "./trailer-stream";
import { XRef } from "./x-ref";
import { XRefEntry } from "./x-ref-entry";

export class XRefStream extends XRef {
  private _trailerStream: TrailerStream;

  get prev(): number {
    return this._trailerStream?.Prev;
  }
  
  constructor(trailer: TrailerStream) {
    super(xRefTypes.STREAM);
    this._trailerStream = trailer;
  }
  
  static parse(parser: Parser, bounds: Bounds): ParseResult<XRefStream> {
    if (!parser || !bounds) {
      return null;
    }
    
    const trailerStream = TrailerStream.parse(parser, bounds);   
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

  getEntries(): XRefEntry[] {   
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
      this._trailerStream.W[0], this._trailerStream.W[1], this._trailerStream.W[2]);
    return entries;
  }
}
