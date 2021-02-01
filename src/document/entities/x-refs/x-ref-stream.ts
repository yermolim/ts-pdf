import { xRefTypes } from "../../const";
import { Parser, ParseResult } from "../../parser";
import { TrailerStream } from "./trailer-stream";
import { XRef } from "./x-ref";

export class XRefStream extends XRef {
  private _trailerStream: TrailerStream;
  
  constructor(trailer: TrailerStream) {
    super(xRefTypes.STREAM);
    this._trailerStream = trailer;
  }
  
  static parse(parser: Parser, index: number, 
    skipEmpty = true): ParseResult<XRefStream> {

    return {
      value: new XRefStream(null),
      start: null,
      end: null,
    };
  }
}
