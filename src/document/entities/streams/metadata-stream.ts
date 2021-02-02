import { streamTypes } from "../../common/const";
import { Stream } from "../core/stream";

export class MetadataStream extends Stream {
  /**
   * (Required) The type of metadata stream this dictionary describes
   */
  readonly Subtype: "/XML" = "/XML";
  
  constructor() {
    super(streamTypes.METADATA_STREAM);
  }  
  
  toArray(): Uint8Array {
    return null;
  };
}
