import { xRefTypes } from "../../common/const";
import { Parser, ParseResult } from "../../parser";
import { IndirectObjectParseInfo } from "../core/indirect-object-parse-info";
import { TrailerStream } from "./trailer-stream";
import { XRef } from "./x-ref";

export class XRefStream extends XRef {
  private _trailerStream: TrailerStream;
  
  constructor(trailer: TrailerStream) {
    super(xRefTypes.STREAM);
    this._trailerStream = trailer;
  }
  
  static parse(info: IndirectObjectParseInfo): ParseResult<XRefStream> {
    if (!info) {
      return null;
    }
    
    const trailerStream = TrailerStream.parse(info);   
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
