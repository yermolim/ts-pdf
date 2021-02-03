import { OnOffState } from "../../../common/const";
import { PdfDict } from "../../core/pdf-dict";

export class ViewDict extends PdfDict {
  /** (Required) */
  ViewState: OnOffState;
  
  constructor() {
    super(null);
  }
}
