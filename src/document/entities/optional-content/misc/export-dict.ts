import { OnOffState } from "../../../common/const";
import { PdfDict } from "../../core/pdf-dict";

export class ExportDict extends PdfDict {
  /** (Required) */
  ExportState: OnOffState;
  
  constructor() {
    super(null);
  }
}
