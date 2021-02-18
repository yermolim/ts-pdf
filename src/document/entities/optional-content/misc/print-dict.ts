import { OnOffState } from "../../../const";
import { CryptInfo } from "../../../common-interfaces";
import { PdfDict } from "../../core/pdf-dict";

export class PrintDict extends PdfDict {
  /**
   * (Required) A name object specifying the kind of content controlled by the group; 
   * for example, /Trapping, /PrintersMarks and /Watermark
   */
  Subtype: string;
  /** (Required) */
  PrintState: OnOffState;
  
  constructor() {
    super(null);
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
