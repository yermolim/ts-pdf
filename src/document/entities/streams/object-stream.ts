import { streamTypes } from "../../common/const";
import { ObjectId } from "../core/object-id";
import { PdfStream } from "../core/pdf-stream";

export class ObjectStream extends PdfStream {
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
  Extends: ObjectId;

  constructor() {
    super(streamTypes.OBJECT_STREAM);
  }  
  
  toArray(): Uint8Array {
    return new Uint8Array();
  }
}
