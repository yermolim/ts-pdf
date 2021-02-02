import { Dict } from "../../core/dict";
import { annotationTypes } from "../annotation-dict";
import { MarkupAnnotation } from "./markup-annotation";

export const attachmentIconTypes = {
  PUSH_PIN: "/GraphPushPin",
  PAPER_CLIP: "/PaperclipTag",
} as const;
export type AttachmentIconType = typeof attachmentIconTypes[keyof typeof attachmentIconTypes];

export class FileAttachmentAnnotation extends MarkupAnnotation {
  /**
   * (Required) The file associated with this annotation
   */
  FS: Dict; // TODO: implement file specification dictionary
  /**
   * (Optional) The name of an icon that shall be used in displaying the annotation
   */
  Name: AttachmentIconType = attachmentIconTypes.PUSH_PIN;
  
  constructor() {
    super(annotationTypes.FILE_ATTACHMENT);
  }
}
