import { streamTypes } from "../../common/const";
import { TextStream } from "./text-stream";

export class MetadataStream extends TextStream {
  /**
   * (Required) The type of metadata stream this dictionary describes
   */
  readonly Subtype: "/XML" = "/XML";
  
  constructor() {
    super(streamTypes.METADATA_STREAM);
  }  
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
