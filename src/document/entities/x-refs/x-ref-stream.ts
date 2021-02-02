import { xRefTypes } from "../../common/const";
import { Bounds, Parser, ParseResult } from "../../parser";
import { TrailerStream } from "./trailer-stream";
import { XRef } from "./x-ref";

export class XRefStream extends XRef {
  private _trailerStream: TrailerStream;
  
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
    console.log(xrefStream); 
  
    return {
      value: xrefStream,
      start: null,
      end: null,
    };
  }
}
