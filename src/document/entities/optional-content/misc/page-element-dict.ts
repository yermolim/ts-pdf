import { DictObj } from "../../core/dict-obj";
import { PageElementType } from "../oc-const";
export class PageElementDict extends DictObj {
  /** (Required) */
  Subtype: PageElementType;
  
  constructor() {
    super(null);
  }
}
