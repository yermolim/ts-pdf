import { xRefTypes } from "../../common/const";
import { Parser, ParseResult } from "../../parser";
import { TrailerDict } from "./trailer-dict";
import { TrailerStream } from "./trailer-stream";
import { XRef } from "./x-ref";

export class XRefHybrid extends XRef {
  private _trailerDict: TrailerDict;
  private _trailerStream: TrailerStream;

  constructor(trailerDict: TrailerDict, trailerStream: TrailerStream) {
    super(xRefTypes.HYBRID);    
    this._trailerDict = trailerDict;
    this._trailerStream = trailerStream;
  } 
  
  static parse(parser: Parser, index: number, 
    skipEmpty = true): ParseResult<XRefHybrid> {

    return {
      value: new XRefHybrid(null, null),
      start: null,
      end: null,
    };
  }
}
