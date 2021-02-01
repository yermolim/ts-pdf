import { xRefTypes } from "../../const";
import { Parser, ParseResult } from "../../parser";
import { XRef } from "./x-ref";

export class XRefStream extends XRef {
  constructor() {
    super(xRefTypes.STREAM);
    
  }
  
  static parse(parser: Parser, index: number, 
    skipEmpty = true): ParseResult<XRefStream> {

    return {
      value: new XRefStream(),
      start: null,
      end: null,
    };
  }
}
