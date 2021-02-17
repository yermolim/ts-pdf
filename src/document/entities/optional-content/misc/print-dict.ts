import { OnOffState } from "../../../const";
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
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
