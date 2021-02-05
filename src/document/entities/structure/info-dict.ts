import { dictTypes } from "../../common/const";
import { DateString } from "../common/date-string";
import { PdfDict } from "../core/pdf-dict";

export class InfoDict extends PdfDict {
  /** (Optional; PDF 1.1+) */
  Title: string;
  /** (Optional) */
  Author: string;
  /** (Optional; PDF 1.1+) */
  Subject: string;
  /** (Optional; PDF 1.1+) */
  Keywords: string;
  /**
   * (Optional) If the document was converted to PDF from another format, 
   * the name of the conforming product that created the original document 
   * from which it was converted
   */
  Creator: string;
  /**
   * (Optional) If the document was converted to PDF from another format, 
   * the name of the conforming product that converted it to PDF
   */
  /** (Optional) */
  Producer: string;
  /** (Optional) */
  CreationDate: DateString;
  /**
   * (Required if PieceInfo is present in the document catalogue; 
   * otherwise optional; PDF 1.1+) The date and time 
   * the document was most recently modified, in human-readable form
   */
  ModDate: DateString;
  
  constructor() {
    super(dictTypes.EMPTY);
  }
  
  toArray(): Uint8Array {
    return new Uint8Array();
  }
}
