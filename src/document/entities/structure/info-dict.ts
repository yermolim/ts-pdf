import { dictObjTypes } from "../../const";
import { DateString } from "../common/date-string";
import { DictObj } from "../core/dict-obj";

export class InfoDict extends DictObj {
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
    super(dictObjTypes.EMPTY);
  }
}
