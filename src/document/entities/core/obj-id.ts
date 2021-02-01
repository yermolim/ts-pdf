import { codes } from "../../common/codes";
import { Parser, ParseResult } from "../../parser";

export class ObjId {
  /** A positive integer object number */
  readonly id: number;
  /** A non-negative integer generation number. 
   * In a newly created file, all indirect objects 
   * shall have generation numbers of 0. 
   * Nonzero generation numbers may be introduced 
   * when the file is later updated */
  readonly generation: number;

  readonly reused: boolean;

  constructor(id: number, generation: number) {
    this.id = id ?? 0;
    this.generation = generation ?? 0;
    this.reused = this.generation > 0;
  }

  static parse(parser: Parser, index: number, 
    skipEmpty = true): ParseResult<ObjId> {    

    const start = skipEmpty
      ? parser.findRegularIndex("straight", index)
      : index;
    if (start < 0 || start > parser.maxIndex) {
      return null;
    }    
    
    const id = parser.parseNumberStartingAtIndex(start, false, false);
    if (!id || isNaN(id.value)) {
      return null;
    }

    const generation = parser.parseNumberStartingAtIndex(id.end + 2, false, false);
    if (!generation || isNaN(generation.value)) {
      return null;
    }

    return {
      value: new ObjId(id.value, generation.value),
      start,
      end: generation.end,
    };
  }
  
  static parseRef(parser: Parser, index: number, 
    skipEmpty = true): ParseResult<ObjId> {    

    const id = ObjId.parse(parser, index, skipEmpty);
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

  equals(other: ObjId) {
    return this.id === other.id 
      && this.generation === other.generation;
  }

  toArray(): Uint8Array {
    return new TextEncoder().encode(`${this.id} ${this.generation} R`);
  }
}
