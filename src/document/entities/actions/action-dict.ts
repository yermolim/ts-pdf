import { dictTypes, ActionType } from "../../const";
import { CryptInfo } from "../../common-interfaces";
import { PdfDict } from "../core/pdf-dict";

export class ActionDict extends PdfDict {
  /**(Required) The type of action that this dictionary describes */
  readonly S: ActionType;
  /**
   * (Optional; PDF 1.2+)The next action or sequence of actions 
   * that shall be performed after the action represented by this dictionary. 
   * The value is either a single action dictionary or an array of action dictionaries 
   * that shall be performed in order
   */
  D: ActionDict | ActionDict[];
  
  constructor(type: ActionType) {
    super(dictTypes.ACTION);

    this.S = type;
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
