import { OnOffState } from "../../../spec-constants";
import { CryptInfo } from "../../../encryption/interfaces";
import { PdfDict } from "../../core/pdf-dict";

export class ViewDict extends PdfDict {
  /** (Required) */
  ViewState: OnOffState;
  
  constructor() {
    super(null);
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
