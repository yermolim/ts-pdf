import { OnOffState } from "../../../common/const";
import { Dict } from "../../core/dict";

export class ViewDict extends Dict {
  /** (Required) */
  ViewState: OnOffState;
  
  constructor() {
    super(null);
  }
}
