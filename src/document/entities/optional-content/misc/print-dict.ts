import { OnOffState } from "../../../common/const";
import { Dict } from "../../core/dict";

export class PrintDict extends Dict {
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
