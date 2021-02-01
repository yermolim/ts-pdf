import { xRefTypes } from "../../const";
import { Parser, ParseResult } from "../../parser";
import { XRef } from "./x-ref";

export class XRefHybrid extends XRef {

  constructor() {
    super(xRefTypes.HYBRID);
    
  } 
  
  static parse(parser: Parser, index: number, 
    skipEmpty = true): ParseResult<XRefHybrid> {

    return {
      value: new XRefHybrid(),
      start: null,
      end: null,
    };
  }
}
