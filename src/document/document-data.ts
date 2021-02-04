import { keywordCodes } from "./common/codes";
import { maxGeneration, xRefEntryTypes } from "./common/const";
import { DocumentParser, ParseResult } from "./document-parser";
import { ObjectId } from "./entities/common/object-id";
import { XRef } from "./entities/x-refs/x-ref";
import { XRefEntry } from "./entities/x-refs/x-ref-entry";
import { XRefStream } from "./entities/x-refs/x-ref-stream";
import { XRefTable } from "./entities/x-refs/x-ref-table";


interface Reference {  
  objectId: number;
  generation: number;
}

interface UsedReference extends Reference {
  byteOffset: number;
}

interface FreeReference extends Reference {
  nextId: number;
  next?: FreeReference;
}

class ReferenceData {  
  readonly freeLinkedList: FreeReference;
  readonly freeOutsideListMap: Map<number, FreeReference>;
  readonly usedMap: Map<number, UsedReference>;

  constructor(entries: XRefEntry[]) {    
    // #region free object references
    /*
    There are two ways an entry may be a member of the free entries list. 
    
    Using the basic mechanism the free entries in the cross-reference table 
    may form a linked list, with each free entry containing the object number of the next. 
    The first entry in the table (object number 0) shall always be free and 
    shall have a generation number of 65.535; it is shall be the head of the linked list 
    of free objects. The last free entry (the tail of the linked list) links back 
    to object number 0. 
    
    Using the second mechanism, the table may contain other free entries 
    that link back to object number 0 and have a generation number of 65.535, 
    even though these entries are not in the linked list itself
     */

    const zeroFreeRef: FreeReference = {
      objectId: 0,
      generation: maxGeneration,
      nextId: 0,
    };

    const freeLinkedList = zeroFreeRef;
    const freeOutsideListMap = new Map<number, FreeReference>();

    // get all free object entries
    const freeMap = new Map<number, FreeReference>([
      [0, zeroFreeRef],
    ]);
    let zeroFound = false;
    for (const entry of entries) {
      if (entry.type !== xRefEntryTypes.FREE) {
        continue;
      }

      if (!zeroFound && entry.objectId === 0) {
        zeroFound = true;
        zeroFreeRef.nextId = entry.nextFreeId;
      }
      
      const valueFromMap = freeMap.get(entry.objectId);
      if (!valueFromMap || valueFromMap.generation < entry.generation) {
        freeMap.set(entry.objectId, {
          objectId: entry.objectId, 
          generation: entry.generation, 
          nextId: entry.nextFreeId});
      }
    }

    // fill the linked list of free objects
    let nextId: number;
    let next: FreeReference;
    let currentRef = zeroFreeRef;
    while (true) {
      nextId = currentRef.nextId;
      next = freeMap.get(nextId);
      freeMap.delete(nextId);
      currentRef.next = next;
      if (!nextId) {
        break;
      }
      currentRef = next;
    }

    // find free objects outside the linked list
    [...freeMap].forEach(x => {
      const value = x[1];
      if (value.generation === maxGeneration && value.nextId === 0) {
        freeOutsideListMap.set(value.objectId, value);
      }
    });

    this.freeLinkedList = freeLinkedList;
    this.freeOutsideListMap = freeOutsideListMap;
    // #endregion

    // #region in-use object references
    const normalRefs = new Map<number, UsedReference>();

    for (const entry of entries) {
      if (entry.type !== xRefEntryTypes.NORMAL
        || !this.checkReference(entry)) {
        continue;
      }

      const valueFromMap = normalRefs.get(entry.objectId);
      if (valueFromMap && valueFromMap.generation >= entry.generation) {
        continue;
      }
      
      normalRefs.set(entry.objectId, {
        objectId: entry.objectId,
        generation: entry.generation,
        byteOffset: entry.byteOffset,
      });
    }

    for (const entry of entries) {
      if (entry.type !== xRefEntryTypes.COMPRESSED
        || !this.checkReference(entry)) {
        continue;
      }

      const valueFromMap = normalRefs.get(entry.objectId);
      if (valueFromMap) {
        continue;
      }
      
      const offset = normalRefs.get(entry.streamId)?.byteOffset;
      if (offset) {        
        normalRefs.set(entry.objectId, {
          objectId: entry.objectId,
          generation: entry.generation,
          byteOffset: offset,
        });
      }
    }

    this.usedMap = normalRefs;
    // #endregion
  }

  /**
   * returns 'false' if the reference is freed or 'true' otherwise
   * @param ref 
   */
  checkReference(ref: Reference): boolean {
    if (this.freeOutsideListMap.has(ref.objectId)) {
      return false;
    }
    let listRef = this.freeLinkedList;
    while (listRef.nextId) {
      if (ref.objectId === listRef.objectId && ref.generation < listRef.generation) {
        return false;
      }
      listRef = listRef.next;
    }
    return true;
  }
}

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
