import { ActionDict } from "./action-dict";
import { actionTypes } from "../../const";

export class UriAction extends ActionDict {
  /**
   * (Required)The uniform resource identifier to resolve, encoded in 7-bit ASCII
   */
  URI: string;
  /**
   * (Optional) A flag specifying whether to track the mouse position when the URI is resolved
   */
  IsMap = false;
  
  constructor() {
    super(actionTypes.RESOLVE_URI);
  }
}
