import { OnOffState, onOffStates } from "../../../common/const";
import { PdfDict } from "../../core/pdf-dict";

export class LanguageDict extends PdfDict {
  /**
   * (Required) A text string that specifies a language and possibly a locale
   */
  Lang: string;
  /** (Optional) */
  Preferred: OnOffState = onOffStates.OFF;
  
  constructor() {
    super(null);
  }
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
