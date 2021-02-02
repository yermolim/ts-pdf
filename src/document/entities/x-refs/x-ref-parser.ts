import { keywordCodes } from "../../common/codes";
import { objectTypes } from "../../common/const";
import { Parser, ParseResult } from "../../parser";
import { ObjectId } from "../core/object-id";
import { ParseInfo } from "../core/parse-info";
import { XRef } from "./x-ref";
import { XRefHybrid } from "./x-ref-hybrid";
import { XRefStream } from "./x-ref-stream";
import { XRefTable } from "./x-ref-table";

export class XRefParser {
  private readonly _parser: Parser;

  private _lastXRefStartIndex: number;

  constructor(parser: Parser) {
    this._parser = parser;
  }

  parseNextXref(): ParseResult<XRef> {
    const xrefStartIndex = this._parser.findSubarrayIndex(keywordCodes.XREF_START, 
      {maxIndex: this._lastXRefStartIndex, direction: "reverse"});
    if (!xrefStartIndex) {
      return null;
    }

    const xrefIndex = this._parser.parseNumberAt(xrefStartIndex.end + 1);
    if (!xrefIndex) {
      return null;
    }

    console.log(xrefIndex.value);
    
    const xrefTableIndex = this._parser.findSubarrayIndex(keywordCodes.XREF_TABLE, 
      {minIndex: xrefIndex.value, closedOnly: true});
    if (xrefTableIndex && xrefTableIndex.start === xrefIndex.value) {      
      const xrefStmIndex = this._parser.findSubarrayIndex(keywordCodes.XREF_HYBRID,
        {minIndex: xrefIndex.value, maxIndex: xrefStartIndex.start, closedOnly: true});
      if (xrefStmIndex) {    
        console.log("XRef is hybrid");
        return XRefHybrid.parse(this._parser, xrefIndex.value);
      } else {
        console.log("XRef is table");
        return XRefTable.parse(this._parser, xrefIndex.value);
      }
    }
    
    const id = ObjectId.parse(this._parser, xrefIndex.value, false);
    if (!id) {
      return null;
    }
    const xrefStreamBounds = this._parser.getIndirectObjectBoundsAt(id.end + 1);   
    if (!xrefStreamBounds) {      
      return null;
    }
    console.log("XRef is stream");    
    return XRefStream.parse(this._parser, xrefStreamBounds);
  }
}
