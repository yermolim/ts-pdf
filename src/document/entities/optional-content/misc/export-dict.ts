import { OnOffState } from "../../../common/const";
import { PdfDict } from "../../core/pdf-dict";

export class ExportDict extends PdfDict {
  /** (Required) */
  ExportState: OnOffState;
  
  constructor() {
    super(null);
  }
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
