import { CryptInfo } from "../../../common-interfaces";
import { PdfDict } from "../../core/pdf-dict";
import { PageElementType } from "../../../const";
export class PageElementDict extends PdfDict {
  /** (Required) */
  Subtype: PageElementType;
  
  constructor() {
    super(null);
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
