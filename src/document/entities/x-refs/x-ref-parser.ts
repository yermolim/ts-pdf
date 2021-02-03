import { keywordCodes } from "../../common/codes";
import { Parser, ParseResult } from "../../parser";
import { ObjectId } from "../core/object-id";
import { XRef } from "./x-ref";
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

    let xrefIndex = this._parser.parseNumberAt(xrefStartIndex.end + 1);
    if (!xrefIndex) {
      return null;
    }
    
    const xrefTableIndex = this._parser.findSubarrayIndex(keywordCodes.XREF_TABLE, 
      {minIndex: xrefIndex.value, closedOnly: true});
    if (xrefTableIndex && xrefTableIndex.start === xrefIndex.value) {      
      const xrefStmIndexProp = this._parser.findSubarrayIndex(keywordCodes.XREF_HYBRID,
        {minIndex: xrefIndex.value, maxIndex: xrefStartIndex.start - 1, closedOnly: true});
      if (xrefStmIndexProp) {    
        console.log("XRef is hybrid");
        xrefIndex = this._parser.parseNumberAt(xrefStmIndexProp.end + 1);
        if (!xrefIndex) {
          return null;
        }
      } else {
        console.log("XRef is table");
        return XRefTable.parse(this._parser, xrefIndex.value);
      }
    } else {
      console.log("XRef is stream");  
    }

    const id = ObjectId.parse(this._parser, xrefIndex.value, false);
    if (!id) {
      return null;
    }

    const xrefStreamBounds = this._parser.getIndirectObjectBoundsAt(id.end + 1);   
    if (!xrefStreamBounds) {      
      return null;
    }  
    return XRefStream.parse(this._parser, xrefStreamBounds);  
  }
}
