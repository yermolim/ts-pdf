import { OnOffState } from "../../../const";
import { DataCryptor } from "../../../crypto";
import { PdfDict } from "../../core/pdf-dict";

export class ExportDict extends PdfDict {
  /** (Required) */
  ExportState: OnOffState;
  
  constructor() {
    super(null);
  }
  
  toArray(cryptor?: DataCryptor): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
