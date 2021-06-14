import { OnOffState, onOffStates } from "../../../spec-constants";
import { CryptInfo } from "../../../common-interfaces";
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
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
