import { LinkedList } from "../common/types";

import { FreeReference, UsedReference, Reference } from "./common-interfaces";
import { xRefEntryTypes } from "./const";

import { XRefEntry } from "./entities/x-refs/x-ref-entry";

import { ReferenceData } from "./reference-data";

/**a class that encapsulates isolated changes to the reference data */
export class ReferenceDataChange {
  private readonly _refData: ReferenceData;

  private readonly _freeLinkedList: LinkedList<FreeReference>;
  private readonly _usedMap: Map<number, UsedReference>;

  private _size: number; 
  public get size(): number {
    return this._size;
  }
  
  constructor(refData: ReferenceData) {
    this._refData = refData;
    this._size = refData.size;

    const freeLinkedList = new LinkedList<FreeReference>();
    for (const freeRef of refData.freeLinkedList) {
      freeLinkedList.push(Object.assign({}, freeRef));
    }
    this._freeLinkedList = freeLinkedList;

    this._usedMap = new Map<number, UsedReference>();
  }

  getUsedRef(id: number): UsedReference {
    return this._usedMap.get(id);
  }

  /**
   * get a free reference and set it as used at the specified offset value
   * @param byteOffset 
   * @param forceNew ignore freed references
   * @returns 
   */
  takeFreeRef(byteOffset: number, forceNew = false): UsedReference {
    let ref: UsedReference;
    if (!forceNew && this._freeLinkedList.length > 1) {
      const freeRef = this._freeLinkedList.pop();
      this._freeLinkedList.tail.nextFreeId = 0;
      ref = {
        id: freeRef.id, 
        generation: freeRef.generation, 
        byteOffset,
      };
    } else {
      ref = {
        id: this._size++, 
        generation: 0, 
        byteOffset,
      };
    }

    this._usedMap.set(ref.id, ref);
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
      const ref: FreeReference = {id: id, generation: gen + 1, nextFreeId: 0};    

      // check if the id is not already in the free list
      const index = this._freeLinkedList.findIndex(ref, (a, b) => 
        a.id === b.id && a.generation <= b.generation);
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

  /**apply changes made to the reference */
  updateUsedRef(ref: UsedReference) { 
    if (ref.compressed && ref.generation) {
      throw new Error(`Compressed ref generation can't be greater than zero: '${ref.id} ${ref.generation} R'`);
    }

    if (this.isFreed(ref)) {      
      throw new Error(`The reference is freed: '${ref.id} ${ref.generation} R'`);
    }

    const current = this._usedMap.get(ref.id);
    if (current) {
      // the ref is already taken within the current change
      throw new Error(`Same reference has been issued twice: '${current.id} ${current.generation} R'`);
    } 

    if (this._refData.isUsed(ref.id)) { 
      const gen = this._refData.getGeneration(ref.id);
      if (ref.generation >= gen) {
        this._usedMap.set(ref.id, ref);
        return true;
      }
      throw new Error(`The reference has an old generation: '${current.id} ${current.generation} R'`);
    }

    throw new Error(`The reference is not used: '${current.id} ${current.generation} R'`);
  }

  /**export all the references including new and updated ones as cross-reference section entries */
  exportEntries(): XRefEntry[] {
    const entries: XRefEntry[] = [];
    for (const entry of this._freeLinkedList) {
      entries.push(new XRefEntry(xRefEntryTypes.FREE, entry.id,
        entry.generation, null, entry.nextFreeId));
    }
    this._usedMap.forEach(v => {
      if (v.compressed) {
        entries.push(new XRefEntry(xRefEntryTypes.COMPRESSED, v.id,
          0, null, null, v.streamId, v.streamIndex));
      } else {
        entries.push(new XRefEntry(xRefEntryTypes.NORMAL, v.id,
          v.generation, v.byteOffset));
      }
    });

    return entries;
  }
  
  /**check if the reference is freed */
  isFreed(ref: Reference): boolean {
    return this._freeLinkedList.has(<FreeReference>ref, (a, b) => 
      a.id === b.id && a.generation < b.generation);
  }

  /**check if PDF object id is used in the source reference data */
  isUsedInSource(id: number): boolean {    
    return this._refData.isUsed(id);
  }
}
