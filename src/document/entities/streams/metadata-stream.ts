import { streamTypes } from "../../common/const";
import { IndirectObjectParseInfo } from "../core/indirect-object-parse-info";
import { Stream } from "../core/stream";

export class MetadataStream extends Stream {
  /**
   * (Required) The type of metadata stream this dictionary describes
   */
  readonly Subtype: "/XML" = "/XML";
  
  constructor(parseInfo?: IndirectObjectParseInfo) {
    super(parseInfo, streamTypes.METADATA_STREAM);
  }
  
  toArray(): Uint8Array {
    return null;
  };
}
