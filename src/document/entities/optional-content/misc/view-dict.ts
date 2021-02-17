import { OnOffState } from "../../../const";
import { DataCryptor } from "../../../crypto";
import { PdfDict } from "../../core/pdf-dict";

export class ViewDict extends PdfDict {
  /** (Required) */
  ViewState: OnOffState;
  
  constructor() {
    super(null);
  }
  
  toArray(cryptor?: DataCryptor): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
