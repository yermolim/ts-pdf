import { CryptInfo } from "../../../encryption/interfaces";
import { PdfDict } from "../../core/pdf-dict";

export class ZoomDict extends PdfDict {
  /**
   * (Required) The minimum recommended magnification factor 
   * at which the group shall be ON
   */
  min = 0;
  /**
   * (Required) The magnification factor below which the group shall be ON
   */
  max = Infinity;
  
  constructor() {
    super(null);
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
