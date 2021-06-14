import { LinkedList } from "../../common/types";

import { maxGeneration, xRefEntryTypes } from "../spec-constants";
import { FreeReference, Reference, UsedReference } from "../common-interfaces";

import { XRef } from "../entities/x-refs/x-ref";
import { XRefEntry } from "../entities/x-refs/x-ref-entry";

/**
 * a class that encapsulates the logic related to
 * getting/adding/updating/removing PDF object references 
 */
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
      // split cross-reference section entries by type
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
        if (entry.id > maxId) {
          maxId = entry.id;
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

    // mandatory free zero reference
    const zeroFreeRef: FreeReference = {
      id: 0,
      generation: maxGeneration,
      nextFreeId: 0,
    };
    const freeLinkedList = new LinkedList<FreeReference>(zeroFreeRef);
    const freeOutsideListMap = new Map<number, FreeReference>();

    // get all free object entries
    const freeMap = new Map<number, FreeReference>();
    let zeroFound = false;
    for (const entry of allFreeEntries) {
      if (!zeroFound && entry.id === 0) {
        zeroFound = true;
        zeroFreeRef.nextFreeId = entry.nextFreeId;
        continue;
      }
      
      const valueFromMap = freeMap.get(entry.id);
      if (!valueFromMap || valueFromMap.generation < entry.generation) {
        freeMap.set(entry.id, {
          id: entry.id, 
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
      freeLinkedList.push(next);
      nextId = next.nextFreeId;
    }

    // find free objects outside the linked list
    [...freeMap].forEach(x => {
      const value = x[1];
      if (value.generation === maxGeneration && value.nextFreeId === 0) {
        freeOutsideListMap.set(value.id, value);
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

      const valueFromMap = normalRefs.get(entry.id);
      if (valueFromMap && valueFromMap.generation >= entry.generation) {
        continue;
      }
      
      normalRefs.set(entry.id, {
        id: entry.id,
        generation: entry.generation,
        byteOffset: entry.byteOffset,
      });
    }

    for (const entry of allCompressedEntries) {
      if (this.isFreed(entry)) {
        continue;
      }

      const valueFromMap = normalRefs.get(entry.id);
      if (valueFromMap) {
        continue;
      }
      
      const offset = normalRefs.get(entry.streamId)?.byteOffset;
      if (offset) {        
        normalRefs.set(entry.id, {
          id: entry.id,
          generation: entry.generation,
          byteOffset: offset,
          compressed: true,
          streamId: entry.streamId,
          streamIndex: entry.streamIndex,
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

  isFreed(ref: Reference): boolean {
    return this.freeOutsideListMap.has(ref.id)
      || this.freeLinkedList.has(<FreeReference>ref, (a, b) => a.id === b.id && a.generation < b.generation);
  }
  
  isUsed(id: number): boolean {
    return this.usedMap.has(id);
  }
}
