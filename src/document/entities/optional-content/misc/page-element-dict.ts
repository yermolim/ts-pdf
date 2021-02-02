import { Dict } from "../../core/dict";
import { PageElementType } from "../oc-const";
export class PageElementDict extends Dict {
  /** (Required) */
  Subtype: PageElementType;
  
  constructor() {
    super(null);
  }
}
