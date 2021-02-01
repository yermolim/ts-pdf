import { keywordCodes } from "../../codes";
import { Parser, ParseResult } from "../../parser";
import { ObjInfo } from "../core/obj-info";
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

    const xrefIndex = this._parser.parseNumberStartingAtIndex(xrefStartIndex.end + 1);
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

    const xrefObj = ObjInfo.parse(this._parser, xrefIndex.value, false);    
    if (!xrefObj) {      
      return null;
    }
    console.log("XRef is stream");
    console.log(xrefObj);
    console.log(String.fromCharCode(...this._parser["_data"].slice(xrefObj.start, xrefObj.end + 1)));
    
    return XRefStream.parse(this._parser, xrefObj.value);
  }
}
