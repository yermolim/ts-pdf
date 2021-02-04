import { keywordCodes } from "../common/codes";
import { DocumentParser, ParseResult } from "./document-parser";
import { ObjectId } from "../entities/common/object-id";
import { XRef } from "../entities/x-refs/x-ref";
import { XRefEntry } from "../entities/x-refs/x-ref-entry";
import { XRefStream } from "../entities/x-refs/x-ref-stream";
import { XRefTable } from "../entities/x-refs/x-ref-table";
import { ReferenceData } from "./reference-data";

export class DocumentData {
  private readonly _parser: DocumentParser;

  private readonly _version: string;
  private readonly _lastXrefIndex: number;

  private _currentXrefIndex: number;
  private _prevXrefIndex: number; 
  private _xrefs: XRef[];
  private _size: number;

  private _referenceData: ReferenceData;

  constructor(parser: DocumentParser) {
    this._parser = parser;

    this._version = this._parser.getPdfVersion();

    const lastXrefIndex = this.parseLastXrefIndex();
    if (!lastXrefIndex) {{
      throw new Error("File don't contain any XRefs");
    }}
    this._lastXrefIndex = lastXrefIndex.value;
    this._prevXrefIndex = this._lastXrefIndex;
  }  

  parse() {
    this._xrefs = this.parseAllXrefs();

    console.log(this._xrefs);

    const entries: XRefEntry[] = [];
    this._xrefs.forEach(x => {
      entries.push(...x.getEntries());
    });
    
    this._referenceData = new ReferenceData(entries);
    
    console.log(this._referenceData);
  }

  reset() {
    this._prevXrefIndex = this._lastXrefIndex;
    this._currentXrefIndex = null;
    this._xrefs = null;
    this._size = null;
    
    this._referenceData = null;
  }
  
  parseAllXrefs(): XRef[] {
    this.reset();

    const xrefs: XRef[] = [];
    let xref: XRef;
    do {
      xref = this.parsePrevXref();
      if (xref) {
        xrefs.push(xref);
      }
    } while (xref);

    return xrefs;
  }

  parsePrevXref(): XRef {
    const max = this._currentXrefIndex || this._parser.maxIndex;  
    let start = this._prevXrefIndex;
    if (!start) {
      return null;
    }
    
    const xrefTableIndex = this._parser.findSubarrayIndex(keywordCodes.XREF_TABLE, 
      {minIndex: start, closedOnly: true});
    if (xrefTableIndex && xrefTableIndex.start === start) {      
      const xrefStmIndexProp = this._parser.findSubarrayIndex(keywordCodes.XREF_HYBRID,
        {minIndex: start, maxIndex: max, closedOnly: true});
      if (xrefStmIndexProp) {    
        console.log("XRef is hybrid");
        const streamXrefIndex = this._parser.parseNumberAt(xrefStmIndexProp.end + 1);
        if (!streamXrefIndex) {
          return null;
        }
        start = streamXrefIndex.value;
      } else {
        console.log("XRef is table");
        const xrefTable = XRefTable.parse(this._parser, start);        
        if (xrefTable?.value) {
          this._currentXrefIndex = start;
          this._prevXrefIndex = xrefTable.value.prev;
          if (!this._size) {
            this._size = xrefTable.value.size;
          }
        }
        return xrefTable?.value;
      }
    } else {
      console.log("XRef is stream"); 
    }

    const id = ObjectId.parse(this._parser, start, false);
    if (!id) {
      return null;
    }
    const xrefStreamBounds = this._parser.getIndirectObjectBoundsAt(id.end + 1);   
    if (!xrefStreamBounds) {      
      return null;
    }       
    const xrefStream = XRefStream.parse(this._parser, xrefStreamBounds);

    if (xrefStream?.value) {
      this._currentXrefIndex = start;
      this._prevXrefIndex = xrefStream.value.prev;
      if (!this._size) {
        this._size = xrefStream.value.size;
      }
    }
    return xrefStream?.value; 
  }

  private parseLastXrefIndex(): ParseResult<number> {
    const xrefStartIndex = this._parser.findSubarrayIndex(keywordCodes.XREF_START, 
      {maxIndex: this._parser.maxIndex, direction: "reverse"});
    if (!xrefStartIndex) {
      return null;
    }

    const xrefIndex = this._parser.parseNumberAt(xrefStartIndex.end + 1);
    if (!xrefIndex) {
      return null;
    }

    return xrefIndex;
  }
}
