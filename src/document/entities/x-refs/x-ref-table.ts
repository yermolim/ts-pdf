import { xRefTypes } from "../../const";
import { Parser, ParseResult } from "../../parser";
import { XRef } from "./x-ref";

export class XRefTable extends XRef {
  constructor() {
    super(xRefTypes.TABLE);
    
  }

  static parse(parser: Parser, index: number, 
    skipEmpty = true): ParseResult<XRefTable> {

    return {
      value: new XRefTable(),
      start: null,
      end: null,
    };
  }
}
