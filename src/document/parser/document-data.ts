import { keywordCodes } from "../common/codes";
import { ObjectId } from "../entities/common/object-id";
import { ObjectStream } from "../entities/streams/object-stream";
import { CatalogDict } from "../entities/structure/catalog-dict";
import { PageDict } from "../entities/structure/page-dict";
import { PageTreeDict } from "../entities/structure/page-tree-dict";
import { XRef } from "../entities/x-refs/x-ref";
import { XRefEntry } from "../entities/x-refs/x-ref-entry";
import { XRefStream } from "../entities/x-refs/x-ref-stream";
import { XRefTable } from "../entities/x-refs/x-ref-table";
import { Bounds, DataParser, ParseInfo, ParseResult } from "./data-parser";
import { ReferenceData } from "./reference-data";

export class DocumentData {
  private readonly _docParser: DataParser;
  private readonly _version: string;    
  private readonly _lastXrefIndex: number;

  private _xrefs: XRef[];
  private _referenceData: ReferenceData;

  private _catalog: CatalogDict;
  private _pagesRoot: PageTreeDict;
  private _pages: PageDict[];

  get size(): number {
    if (this._xrefs?.length) {
      return this._xrefs[0].prev;
    } else {
      return 0;
    }
  }

  constructor(data: Uint8Array) {
    this._docParser = new DataParser(data);
    this._version = this._docParser.getPdfVersion();
    const lastXrefIndex = this._docParser.getLastXrefIndex();
    if (!lastXrefIndex) {{
      throw new Error("File doesn't contain update section");
    }}
    this._lastXrefIndex = lastXrefIndex.value;
  }  

  parse() {
    this.reset();

    const xrefs = this.parseAllXrefs();
    if (!xrefs.length) {{
      throw new Error("Failed to parse cross-reference sections");
    }}
    const entries: XRefEntry[] = [];
    xrefs.forEach(x =>  entries.push(...x.getEntries()));   
    if (!entries.length) {{
      throw new Error("No indirect object references found");
    }}

    this._xrefs = xrefs;
    this._referenceData = new ReferenceData(entries);

    this.parsePageTree();
  }

  reset() {    
    this._xrefs = null;
    this._referenceData = null;
  }
  
  private parseAllXrefs(): XRef[] {
    this.reset();
    
    const xrefs: XRef[] = [];
    let start = this._lastXrefIndex; 
    let max = this._docParser.maxIndex;
    let xref: XRef;
    while (start) {
      xref = this.parsePrevXref(start, max);
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

  private parsePrevXref(start: number, max: number): XRef {
    if (!start) {
      return null;
    }
    
    const xrefTableIndex = this._docParser.findSubarrayIndex(keywordCodes.XREF_TABLE, 
      {minIndex: start, closedOnly: true});
    if (xrefTableIndex && xrefTableIndex.start === start) {      
      const xrefStmIndexProp = this._docParser.findSubarrayIndex(keywordCodes.XREF_HYBRID,
        {minIndex: start, maxIndex: max, closedOnly: true});
      if (xrefStmIndexProp) {    
        console.log("XRef is hybrid");
        const streamXrefIndex = this._docParser.parseNumberAt(xrefStmIndexProp.end + 1);
        if (!streamXrefIndex) {
          return null;
        }
        start = streamXrefIndex.value;
      } else {
        console.log("XRef is table");
        const xrefTable = XRefTable.parse(this._docParser, start);
        return xrefTable?.value;
      }
    } else {
      console.log("XRef is stream"); 
    }

    const id = ObjectId.parse(this._docParser, start, false);
    if (!id) {
      return null;
    }
    const xrefStreamBounds = this._docParser.getIndirectObjectBoundsAt(id.end + 1);   
    if (!xrefStreamBounds) {      
      return null;
    }       
    const xrefStream = XRefStream.parse({parser: this._docParser, bounds: xrefStreamBounds});
    return xrefStream?.value; 
  }

  private parsePageTree() {  
    const catalogId = this._xrefs[0].root;
    const catalogParseInfo = this.getObjectParseInfo(catalogId.id);
    const catalog = CatalogDict.parse(catalogParseInfo);
    this._catalog = catalog?.value;

    console.log(catalog);
    
    const pagesId = catalog.value.Pages;
    const pagesParseInfo = this.getObjectParseInfo(pagesId.id);
    const pages = PageTreeDict.parse(pagesParseInfo);
    
    console.log(pages);
  }

  /**
   * returns a proper parser instance and byte bounds for the object by its id.
   * returns null if an object with the specified id not found.
   * @param id 
   */
  private getObjectParseInfo(id: number): ParseInfo {
    if (!id) {
      return null;
    }
    const offset = this._referenceData?.getOffset(id);
    if (isNaN(offset)) {
      return null;
    } 
    
    const objectId = ObjectId.parse(this._docParser, offset);
    if (!objectId) {
      return null;
    }   

    const bounds = this._docParser.getIndirectObjectBoundsAt(objectId.end + 1, true);
    if (!bounds) {
      return null;
    }
    const info = {parser: this._docParser, bounds};

    if (objectId.value.id === id) {
      // object id equals the sought one, so this is the needed object
      return info;
    } 

    // object id at the given offset is not equal to the sought one
    // check if the object is an object stream and try to find the needed object inside it
    const stream = ObjectStream.parse(info);
    if (!stream) {
      return;
    }
    const objectBytes = stream.value.getObjectBytes(id);
    if (objectBytes?.length) {
      // the object is found inside the stream
      return {
        parser: new DataParser(objectBytes), 
        bounds: {start: 0, end: objectBytes.length - 1},
      };
    }

    return null;
  }
}
