import { OnOffState, onOffStates } from "../../../common/const";
import { Dict } from "../../core/dict";

export class LanguageDict extends Dict {
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
