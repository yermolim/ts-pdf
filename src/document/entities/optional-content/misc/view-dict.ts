import { OnOffState } from "../../../const";
import { CryptInfo } from "../../../common-interfaces";
import { PdfDict } from "../../core/pdf-dict";

export class ViewDict extends PdfDict {
  /** (Required) */
  ViewState: OnOffState;
  
  constructor() {
    super(null);
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
