import { annotationTypes, attachmentIconTypes, AttachmentIconType } from "../../../spec-constants";
import { CryptInfo } from "../../../common-interfaces";
import { PdfDict } from "../../core/pdf-dict";
import { MarkupAnnotation } from "./markup-annotation";

export class FileAttachmentAnnotation extends MarkupAnnotation {
  /**
   * (Required) The file associated with this annotation
   */
  FS: PdfDict; // TODO: implement file specification dictionary
  /**
   * (Optional) The name of an icon that shall be used in displaying the annotation
   */
  Name: AttachmentIconType = attachmentIconTypes.PUSH_PIN;
  
  constructor() {
    super(annotationTypes.FILE_ATTACHMENT);
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
  
  // TODO: implement render method
}
