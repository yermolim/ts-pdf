import { dictObjTypes } from "../../common/const";
import { DictObj } from "../core/dict-obj";

export class MeasureDict extends DictObj {
  /** (Optional) A name specifying the type of coordinate system to use for measuring */
  readonly Subtype = "/RL";

  // TODO: Add all rectilinear measure dictionary properties if needed
  
  constructor() {
    super(dictObjTypes.MEASURE);
  }
}
