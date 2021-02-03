import { PdfDict } from "../core/pdf-dict";
import { UsageEvent } from "./oc-const";
import { OcGroupDict } from "./oc-group-dict";

export class UsageDict extends PdfDict {
  /**
   * (Required) A name defining the situation 
   * in which this usage application dictionary should be used
   */
  Event: UsageEvent; 
  /**
   * (Optional) An array listing the optional content groups 
   * that shall have their states automatically managed 
   * based on information in their usage dictionary
   */
  OCGs: OcGroupDict[] = []; 
  /**
   * (Required) An array of names, each of which corresponds
   * to a usage dictionary entry (see Table 102). 
   * When managing the states of the optional content groups in the OCGs array, 
   * each of the corresponding categories in the group’s usage dictionary shall be considered
   */
  Category: string[]; 
  
  constructor() {
    super(null);
  }
}
