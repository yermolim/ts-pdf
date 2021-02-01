import { ObjId } from "../core/obj-id";
import { StreamDict } from "./stream-dict";

export class ObjectStream extends StreamDict {
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
  Extends: ObjId;
  
  constructor() {
    super("/ObjStm");
  }
}
