import { OnOffState } from "../../../common/const";
import { DictObj } from "../../core/dict-obj";

export class ExportDict extends DictObj {
  /** (Required) */
  ExportState: OnOffState;
  
  constructor() {
    super(null);
  }
}
