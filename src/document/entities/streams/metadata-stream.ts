import { streamTypes } from "../../common/const";
import { IndirectObjectInfo } from "../core/indirect-object-info";
import { Stream } from "../core/stream";

export class MetadataStream extends Stream {
  /**
   * (Required) The type of metadata stream this dictionary describes
   */
  readonly Subtype: "/XML" = "/XML";
  
  constructor(info: IndirectObjectInfo) {
    super(info, streamTypes.METADATA_STREAM);
  }
  
  toArray(): Uint8Array {
    return null;
  };
}
