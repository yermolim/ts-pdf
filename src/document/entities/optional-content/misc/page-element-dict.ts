import { PdfDict } from "../../core/pdf-dict";
import { PageElementType } from "../oc-const";
export class PageElementDict extends PdfDict {
  /** (Required) */
  Subtype: PageElementType;
  
  constructor() {
    super(null);
  }
}
