import { streamTypes } from "../../common/const";
import { PdfStream } from "../core/pdf-stream";

export class MetadataStream extends PdfStream {
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
