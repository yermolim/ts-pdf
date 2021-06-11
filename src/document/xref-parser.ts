import { keywordCodes } from "./char-codes";
import { DataParser } from "./data-parser";

import { ObjectId } from "./entities/core/object-id";
import { XRef } from "./entities/x-refs/x-ref";
import { XRefStream } from "./entities/x-refs/x-ref-stream";
import { XRefTable } from "./entities/x-refs/x-ref-table";

export class XrefParser {
  private _dataParser: DataParser;

  /**
   * 
   * @param parser PDF document parser instance
   */
  constructor(parser: DataParser) {
    if (!parser) {
      throw new Error("Parser is not defined");
    }
    this._dataParser = parser;
  }
  
  /**
   * parse a cross-reference section at the specified offset
   * @param start search start byte offset
   * @param max search end byte offset
   * @returns parsed cross-reference section
   */
  parseXref(start: number, max: number): XRef {
    if (!start) {
      return null;
    }

    const offset = start;
    
    const xrefTableIndex = this._dataParser.findSubarrayIndex(keywordCodes.XREF_TABLE, 
      {minIndex: start, closedOnly: true});
    if (xrefTableIndex && xrefTableIndex.start === start) {      
      const xrefStmIndexProp = this._dataParser.findSubarrayIndex(keywordCodes.XREF_HYBRID,
        {minIndex: start, maxIndex: max, closedOnly: true});
      if (xrefStmIndexProp) {
        // HYBRID
        const streamXrefIndex = this._dataParser.parseNumberAt(xrefStmIndexProp.end + 1);
        if (!streamXrefIndex) {
          return null;
        }
        start = streamXrefIndex.value;
      } else {
        // TABLE
        const xrefTable = XRefTable.parse(this._dataParser, start, offset);
        return xrefTable?.value;
      }
    }
    // STREAM
    const id = ObjectId.parse(this._dataParser, start, false);
    if (!id) {
      return null;
    }
    const xrefStreamBounds = this._dataParser.getIndirectObjectBoundsAt(id.end + 1);   
    if (!xrefStreamBounds) {      
      return null;
    }       
    const xrefStream = XRefStream.parse({parser: this._dataParser, bounds: xrefStreamBounds}, offset);
    return xrefStream?.value; 
  }  
  
  /**
   * parse all cross-reference section of the document
   * @param parser PDF document parser instance
   * @param start search start byte offset
   * @returns all document cross-reference sections
   */
  parseAllXrefs(start: number): XRef[] {    
    const xrefs: XRef[] = [];
    let max = this._dataParser.maxIndex;
    let xref: XRef;
    while (start) {
      xref = this.parseXref(start, max);
      if (xref) {
        xrefs.push(xref);        
        max = start;
        start = xref.prev;
      } else {
        break;
      }
    }
    return xrefs;
  }
}
