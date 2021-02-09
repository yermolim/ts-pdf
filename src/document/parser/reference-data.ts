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
      freeLinkedList.push(next);
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

  isFreed(ref: Reference): boolean {
    return this.freeOutsideListMap.has(ref.objectId)
      || this.freeLinkedList.has(<FreeReference>ref, (a, b) => a.objectId === b.objectId && a.generation < b.generation);
  }
  
  isUsed(id: number): boolean {
    return this.usedMap.has(id);
  }
}

export class ReferenceDataChange {
  private readonly _refData: ReferenceData;

  private readonly _freeLinkedList: LinkedList<FreeReference>;
  private readonly _usedMap: Map<number, UsedReference>;
  private _size: number; 
  
  constructor(refData: ReferenceData) {
    this._refData = refData;
    this._size = refData.size;

    const freeLinkedList = new LinkedList<FreeReference>();
    for (const freeRef of refData.freeLinkedList) {
      freeLinkedList.push(freeRef);
    }
    this._freeLinkedList = freeLinkedList;

    this._usedMap = new Map<number, UsedReference>();
  }

  takeFreeRef(byteOffset: number, forceNew = false): UsedReference {
    let ref: UsedReference;
    if (!forceNew && this._freeLinkedList.length > 1) {
      const freeRef = this._freeLinkedList.pop();
      this._freeLinkedList.tail.nextFreeId = 0;
      ref = {
        objectId: freeRef.objectId, 
        generation: freeRef.generation, 
        byteOffset,
      };
    } else {
      ref = {
        objectId: this._size++, 
        generation: 0, 
        byteOffset,
      };
    }

    this._usedMap.set(ref.objectId, ref);
    return ref;
  }

  setRefFree(id: number) {
    // if the specified id was taken within the current change, delete it from the change map
    if (this._usedMap.has(id)) {
      this._usedMap.delete(id);
      // if the specified id was the last one and was appended within the current change, decrease the change size value
      if (this._size > this._refData.size && this._size === id + 1) {
        this._size--;
      }
    }

    // if the specified id is used within the source data, add it to the change free list
    if (this._refData.isUsed(id)) {
      const gen = this._refData.getGeneration(id);
      const ref: FreeReference = {objectId: id, generation: gen + 1, nextFreeId: 0};    

      // check if the id is not already in the free list
      const index = this._freeLinkedList.findIndex(ref, (a, b) => 
        a.objectId === b.objectId && a.generation <= b.generation);
      if (index !== -1) {
        // the id is already in the free list
        return;
      }    

      // append the reference to the free list
      const lastFreeRef = this._freeLinkedList.tail;
      lastFreeRef.nextFreeId = id;
      this._freeLinkedList.push(ref);
    }
  }

  updateUsedRef(ref: UsedReference): boolean { 
    const current = this._usedMap.get(ref.objectId);
    if (current) {
      // the ref is already taken within the current change, 
      // replace it if the generation is not less than the current one
      if (ref.generation >= current.generation) {
        this._usedMap.set(ref.objectId, ref);
        return true;
      }
    } 

    if (this._refData.isUsed(ref.objectId)) { 
      const gen = this._refData.getGeneration(ref.generation);
      if (ref.generation >= gen) {
        this._usedMap.set(ref.objectId, ref);
        return true;
      }
    } 

    // the ref is not used or has an old generation so there is nothing to change
    return false;
  }

  export(): XRefEntry[] {
    return [];
  }
  
  isFreed(ref: Reference): boolean {
    return this._freeLinkedList.has(<FreeReference>ref, (a, b) => a.objectId === b.objectId && a.generation < b.generation);
  }
}
