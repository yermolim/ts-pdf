import { dictTypes } from "../../common/const";
import { Dict } from "../core/dict";

export class MeasureDict extends Dict {
  /** (Optional) A name specifying the type of coordinate system to use for measuring */
  readonly Subtype = "/RL";

  // TODO: Add all rectilinear measure dictionary properties if needed
  
  constructor() {
    super(dictTypes.MEASURE);
  }
}
