import { codes } from "../../encoding/char-codes";
import { CryptInfo, IEncodable } from "../../encryption/interfaces";
import { Reference } from "../../references/reference";
import { DataParser, ParseResult } from "../../data-parser";

/**
 * Immutable class representing PDF indirect object reference
 */
export class ObjectId implements Reference, IEncodable {
  /** A positive integer object number */
  readonly id: number;
  /** A non-negative integer generation number. 
   * In a newly created file, all indirect objects 
   * shall have generation numbers of 0. 
   * Nonzero generation numbers may be introduced 
   * when the file is later updated */
  readonly generation: number;

  constructor(id: number, generation: number) {
    this.id = id ?? 0;
    this.generation = generation ?? 0;
  }

  /**
   * parse plain PDF object id (like '32 0 obj')
   * @param parser PDF document data parser
   * @param start search start byte offset
   * @param skipEmpty skip space chars if found at the start position
   * @returns 
   */
  static parse(parser: DataParser, start: number, 
    skipEmpty = true): ParseResult<ObjectId> {  
    if (skipEmpty) {
      start = parser.findRegularIndex(true, start);
    }
    if (start < 0 || start > parser.maxIndex) {
      return null;
    }    
    
    const id = parser.parseNumberAt(start, false, false);
    if (!id || isNaN(id.value)) {
      return null;
    }

    const generation = parser.parseNumberAt(id.end + 2, false, false);
    if (!generation || isNaN(generation.value)) {
      return null;
    }

    return {
      value: new ObjectId(id.value, generation.value),
      start,
      end: generation.end,
    };
  }
  
  /**
   * parse reference to the PDF object id (like '32 0 R')
   * @param parser PDF document data parser
   * @param start search start byte offset
   * @param skipEmpty skip space chars if found at the start position
   * @returns 
   */
  static parseRef(parser: DataParser, start: number, 
    skipEmpty = true): ParseResult<ObjectId> {    

    const id = ObjectId.parse(parser, start, skipEmpty);
    if (!id) {
      return null;
    }

    const rIndexSupposed = id.end + 2;
    const rIndex = parser.findSubarrayIndex([codes.R], 
      {minIndex: rIndexSupposed, closedOnly: true});
    if (!rIndex || rIndex.start !== rIndexSupposed) {
      return null;
    } 

    return {
      value: id.value,
      start: id.start,
      end: rIndex.end,
    };
  }
  
  /**
   * parse reference to the PDF object id (like '[32 0 R, 33 0 R]')
   * @param parser PDF document data parser
   * @param start search start byte offset
   * @param skipEmpty skip space chars if found at the start position
   * @returns 
   */
  static parseRefArray(parser: DataParser, start: number, 
    skipEmpty = true): ParseResult<ObjectId[]>  {
    const arrayBounds = parser.getArrayBoundsAt(start, skipEmpty);
    if (!arrayBounds) {
      return null;
    }

    const ids: ObjectId[] = [];
    let current: ParseResult<ObjectId>;
    let i = arrayBounds.start + 1;
    while(i < arrayBounds.end) {
      current = ObjectId.parseRef(parser, i, true);
      if (!current) {
        break;
      }
      ids.push(current.value);
      i = current.end + 1;
    }

    return {value: ids, start: arrayBounds.start, end: arrayBounds.end};
  }

  /**
   * create an object id instance from any object implementing Reference
   * @param ref 
   * @returns 
   */
  static fromRef(ref: Reference): ObjectId {
    return new ObjectId(ref.id, ref.generation);
  }

  equals(other: ObjectId) {
    return this.id === other.id 
      && this.generation === other.generation;
  }

  toArray(cryptInfo?: CryptInfo): Uint8Array {
    return new TextEncoder().encode(`${this.id} ${this.generation} R`);
  }

  toString(): string {
    return this.id + "|" + this.generation;
  }
}
