import { OnOffState } from "../../../pdf-const";
import { DictObj } from "../../core/dict-obj";

export class PrintDict extends DictObj {
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
}
