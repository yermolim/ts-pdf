import { OnOffState } from "../../../pdf-const";
import { DictObj } from "../../core/dict-obj";

export class ViewDict extends DictObj {
  /** (Required) */
  ViewState: OnOffState;
  
  constructor() {
    super(null);
  }
}
