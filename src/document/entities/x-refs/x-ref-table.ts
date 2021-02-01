import { xRefTypes } from "../../const";
import { Parser, ParseResult } from "../../parser";
import { TrailerDict } from "./trailer-dict";
import { XRef } from "./x-ref";

export class XRefTable extends XRef {
  private _trailerDict: TrailerDict;

  constructor(trailer: TrailerDict) {
    super(xRefTypes.TABLE);

    this._trailerDict = trailer;
  }

  static parse(parser: Parser, index: number, 
    skipEmpty = true): ParseResult<XRefTable> {

    return {
      value: new XRefTable(null),
      start: null,
      end: null,
    };
  }
}
