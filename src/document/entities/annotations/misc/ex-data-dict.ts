import { dictObjTypes } from "../../../const";
import { DictObj } from "../../core/dict-obj";

export class ExDataDict extends DictObj {
  /**
   * (Required) A name specifying the type of data that the markup annotation shall be associated with
   */
  readonly Subtype = "/Markup3D";
  
  constructor() {
    super(dictObjTypes.EXTERNAL_DATA);
  }
}
