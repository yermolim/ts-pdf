import { OnOffState, onOffStates } from "../../../pdf-const";
import { DictObj } from "../../core/dict-obj";

export class LanguageDict extends DictObj {
  /**
   * (Required) A text string that specifies a language and possibly a locale
   */
  Lang: string;
  /** (Optional) */
  Preferred: OnOffState = onOffStates.OFF;
  
  constructor() {
    super(null);
  }
}
