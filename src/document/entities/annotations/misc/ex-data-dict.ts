import { dictTypes } from "../../../common/const";
import { Dict } from "../../core/dict";

export class ExDataDict extends Dict {
  /**
   * (Required) A name specifying the type of data that the markup annotation shall be associated with
   */
  readonly Subtype = "/Markup3D";
  
  constructor() {
    super(dictTypes.EXTERNAL_DATA);
  }
}
