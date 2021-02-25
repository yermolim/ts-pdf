import { annotationTypes } from "../../../const";
import { CryptInfo } from "../../../common-interfaces";
import { PdfDict } from "../../core/pdf-dict";
import { MarkupAnnotation } from "./markup-annotation";
import { RenderToSvgResult } from "../../../../common";

export const attachmentIconTypes = {
  PUSH_PIN: "/GraphPushPin",
  PAPER_CLIP: "/PaperclipTag",
} as const;
export type AttachmentIconType = typeof attachmentIconTypes[keyof typeof attachmentIconTypes];

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
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
  
  render(): RenderToSvgResult {
    const streamRenderResult = super.render();
    if (streamRenderResult) {
      return streamRenderResult;
    }

    // TODO: implement individual render methods
    return null;
  }
}
