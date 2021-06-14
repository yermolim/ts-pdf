import { OnOffState } from "../../../spec-constants";
import { CryptInfo } from "../../../common-interfaces";
import { PdfDict } from "../../core/pdf-dict";

export class ExportDict extends PdfDict {
  /** (Required) */
  ExportState: OnOffState;
  
  constructor() {
    super(null);
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
