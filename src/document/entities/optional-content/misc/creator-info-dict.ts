import { CryptInfo } from "../../../encryption/interfaces";
import { CreatorInfoType } from "../../../spec-constants";
import { PdfDict } from "../../core/pdf-dict";
export class CreatoInfoDict extends PdfDict {
  /**
   * (Required) A name defining the type of content controlled by the group
   */
  Subtype: CreatorInfoType; 
  /**
   * (Required) A text string specifying the application that created the group
   */
  Creator: string;
  
  constructor() {
    super(null);
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
