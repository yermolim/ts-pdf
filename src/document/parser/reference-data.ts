import { LinkedList } from "../../common/utils";
import { maxGeneration, xRefEntryTypes } from "../common/const";
import { XRef } from "../entities/x-refs/x-ref";
import { XRefEntry } from "../entities/x-refs/x-ref-entry";

export interface Reference {  
  objectId: number;
  generation: number;
}

export interface UsedReference extends Reference {
  byteOffset: number;
  compressed?: boolean;
}

export interface FreeReference extends Reference {
  nextFreeId: number;
}

export class ReferenceData {  
  readonly size: number;
  readonly freeLinkedList: LinkedList<FreeReference>;
  readonly freeOutsideListMap: Map<number, FreeReference>;
  readonly usedMap: Map<number, UsedReference>;

  constructor(xrefs: XRef[]) {       
    // #region get entries
    const allFreeEntries: XRefEntry[] = [];
    const allNormalEntries: XRefEntry[] = [];
    const allCompressedEntries: XRefEntry[] = [];

    let maxId = 0;
    xrefs.forEach(x => {
      for (const entry of x.getEntries()) {
        switch (entry.type) {
          case xRefEntryTypes.FREE:
            allFreeEntries.push(entry);
            break;
          case xRefEntryTypes.NORMAL:
            allNormalEntries.push(entry);
            break;
          case xRefEntryTypes.COMPRESSED:
            allCompressedEntries.push(entry);
            break;
          default:
            continue;
        }
        if (entry.objectId > maxId) {
          maxId = entry.objectId;
        }
      }
    });

    this.size = maxId + 1;
    // #endregion
    
    // #region handle free object references
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
      nextFreeId: 0,
    };
    const freeLinkedList = new LinkedList<FreeReference>(zeroFreeRef);
    const freeOutsideListMap = new Map<number, FreeReference>();

    // get all free object entries
    const freeMap = new Map<number, FreeReference>();
    let zeroFound = false;
    for (const entry of allFreeEntries) {
      if (!zeroFound && entry.objectId === 0) {
        zeroFound = true;
        zeroFreeRef.nextFreeId = entry.nextFreeId;
        continue;
      }
      
      const valueFromMap = freeMap.get(entry.objectId);
      if (!valueFromMap || valueFromMap.generation < entry.generation) {
        freeMap.set(entry.objectId, {
          objectId: entry.objectId, 
          generation: entry.generation, 
          nextFreeId: entry.nextFreeId});
      }
    }

    // fill the linked list of free objects
    let nextId = zeroFreeRef.nextFreeId;
    let next: FreeReference;
    while (nextId) {
      next = freeMap.get(nextId);
      freeMap.delete(nextId);
      freeLinkedList.append(next);
      nextId = next.nextFreeId;
    }

    // find free objects outside the linked list
    [...freeMap].forEach(x => {
      const value = x[1];
      if (value.generation === maxGeneration && value.nextFreeId === 0) {
        freeOutsideListMap.set(value.objectId, value);
      }
    });

    this.freeLinkedList = freeLinkedList;
    this.freeOutsideListMap = freeOutsideListMap;
    // #endregion

    // #region handle in-use object references
    const normalRefs = new Map<number, UsedReference>();

    for (const entry of allNormalEntries) {
      if (this.isFreed(entry)) {
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

    for (const entry of allCompressedEntries) {
      if (this.isFreed(entry)) {
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
          compressed: true,
        });
      }
    }

    this.usedMap = normalRefs;
    // #endregion
  }

  getOffset(id: number): number {
    return this.usedMap.get(id)?.byteOffset;
  }
  
  getGeneration(id: number): number {
    return this.usedMap.get(id)?.generation;
  }




  applyChange() {

  }

  resetChange() {

  }




  private isFreed(ref: Reference): boolean {
    return this.freeOutsideListMap.has(ref.objectId)
      || this.freeLinkedList.has(<FreeReference>ref, (a, b) => a.objectId === b.objectId && a.generation < b.generation);
  }
  
  private isUsed(ref: Reference): boolean {
    return this.usedMap.has(ref.objectId);
  }
}

// class ReferenceDataChange {
//   private readonly _refData: ReferenceData;
//   private size; 

//   private freeLinkedList: FreeReference;
//   private usedMap: Map<number, UsedReference>;
  
//   constructor(refData: ReferenceData) {
//     this._refData = refData;
//     this.size = refData.size;

//     let sourceFreeRef = refData.freeLinkedList;
//     // get last free ref
//     while (true) {
      
//       if (sourceFreeRef.nextFreeId) {
//         sourceFreeRef = sourceFreeRef.next;
//       } else {
//         break;
//       }
//     }

//     this.freeLinkedList = freeRef;
//   }

//   takeFreeRef(): Reference {
//     return null;
//   }

//   setRefFree() {

//   }

//   export(): XRefEntry[] {
//     return [];
//   }
// }
