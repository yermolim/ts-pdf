import { dictTypes } from "../../common/const";
import { PdfDict } from "../core/pdf-dict";

export class MeasureDict extends PdfDict {
  /** (Optional) A name specifying the type of coordinate system to use for measuring */
  readonly Subtype = "/RL";

  // TODO: Add all rectilinear measure dictionary properties if needed
  
  constructor() {
    super(dictTypes.MEASURE);
  }
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
