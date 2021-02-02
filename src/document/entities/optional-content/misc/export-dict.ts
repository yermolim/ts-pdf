import { OnOffState } from "../../../common/const";
import { Dict } from "../../core/dict";

export class ExportDict extends Dict {
  /** (Required) */
  ExportState: OnOffState;
  
  constructor() {
    super(null);
  }
}
