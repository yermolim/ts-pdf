import { OnOffState } from "../../../common/const";
import { PdfDict } from "../../core/pdf-dict";

export class ViewDict extends PdfDict {
  /** (Required) */
  ViewState: OnOffState;
  
  constructor() {
    super(null);
  }
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
