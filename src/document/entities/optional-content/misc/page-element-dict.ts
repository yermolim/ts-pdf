import { CryptInfo } from "../../../common-interfaces";
import { PdfDict } from "../../core/pdf-dict";
import { PageElementType } from "../oc-const";
export class PageElementDict extends PdfDict {
  /** (Required) */
  Subtype: PageElementType;
  
  constructor() {
    super(null);
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
