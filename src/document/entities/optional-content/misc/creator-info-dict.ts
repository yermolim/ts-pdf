import { DictObj } from "../../core/dict-obj";
import { CreatorInfoType } from "../oc-const";
export class CreatoInfoDict extends DictObj {
  /**
   * (Required) A name defining the type of content controlled by the group
   */
  Subtype: CreatorInfoType; 
  /**
   * (Required) A text string specifying the application that created the group
   */
  Creator: string;
  
  constructor() {
    super(null);
  }
}
