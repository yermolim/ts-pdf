import { dictTypes } from "../../../common/const";
import { PdfDict } from "../../core/pdf-dict";

export class ExDataDict extends PdfDict {
  /**
   * (Required) A name specifying the type of data that the markup annotation shall be associated with
   */
  readonly Subtype = "/Markup3D";
  
  constructor() {
    super(dictTypes.EXTERNAL_DATA);
  }
}
