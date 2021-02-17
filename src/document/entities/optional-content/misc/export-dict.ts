import { OnOffState } from "../../../const";
import { CryptInfo } from "../../../interfaces";
import { PdfDict } from "../../core/pdf-dict";

export class ExportDict extends PdfDict {
  /** (Required) */
  ExportState: OnOffState;
  
  constructor() {
    super(null);
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
