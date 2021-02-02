import { IndirectObjectId } from "../core/indirect-object-id";
import { IndirectObjectInfo } from "../core/indirect-object-info";
import { Stream } from "../core/stream";

export class ObjectStream extends Stream {
  /**
   * (Required) The number of indirect objects stored in the stream
   */
  N: number;
  /**
   * (Required) The byte offset in the decoded stream of the first compressed object
   */
  First: number;
  /**
   * (Optional) A reference to another object stream, 
   * of which the current object stream shall be considered an extension
   */
  Extends: IndirectObjectId;
  
  constructor(info: IndirectObjectInfo) {
    super(info, "/ObjStm");
  }
  
  toArray(): Uint8Array {
    return new Uint8Array();
  }
}
