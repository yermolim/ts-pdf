import { xRefTypes } from "../../common/const";
import { Parser, ParseResult } from "../../parser";
import { IndirectObjectInfo } from "../core/indirect-object-info";
import { TrailerStream } from "./trailer-stream";
import { XRef } from "./x-ref";

export class XRefStream extends XRef {
  private _trailerStream: TrailerStream;
  
  constructor(trailer: TrailerStream) {
    super(xRefTypes.STREAM);
    this._trailerStream = trailer;
  }
  
  static parse(parser: Parser, info: IndirectObjectInfo): ParseResult<XRefStream> {
    if (!parser || !info) {
      return null;
    }
    
    const trailerStream = TrailerStream.parse(parser, info);
    if (!trailerStream) {
      return null;
    }
  
    return {
      value: new XRefStream(trailerStream.value),
      start: null,
      end: null,
    };
  }
}
