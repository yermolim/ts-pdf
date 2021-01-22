import { OnOffState } from "../../../pdf-const";
import { DictObj } from "../../core/dict-obj";

export class ExportDict extends DictObj {
  /** (Required) */
  ExportState: OnOffState;
  
  constructor() {
    super(null);
  }
}
