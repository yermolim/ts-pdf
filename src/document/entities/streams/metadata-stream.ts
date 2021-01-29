import { streamTypes } from "../../const";
import { StreamDict } from "./stream-dict";

export class MetadataStream extends StreamDict {
  /**
   * (Required) The type of metadata stream this dictionary describes
   */
  readonly Subtype: "/XML" = "/XML";
  
  constructor() {
    super(streamTypes.METADATA_STREAM);
  }
}
