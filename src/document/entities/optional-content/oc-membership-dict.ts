import { PdfDict } from "../core/pdf-dict";
import { OcGroupDict } from "./oc-group-dict";
import { VisibilityExpression } from "./misc/visibility-expression";
import { VisibilityPolicy, visibilityPolicies } from "./oc-const";
import { dictTypes } from "../../const";

export class OcMembershipDict extends PdfDict {
  /**
   * (Optional) A dictionary or array of dictionaries specifying the optional content groups 
   * whose states shall determine the visibility of content controlled by this membership dictionary
   */
  OCGs: OcGroupDict | OcGroupDict[];
  /**
   * (Optional)A name specifying the visibility policy 
   * for content belonging to this membership dictionary
   */
  P: VisibilityPolicy = visibilityPolicies.ANY_ON; 
  /**
   * (Optional; PDF 1.6+) An array specifying a visibility expression, 
   * used to compute visibility of content based on a set of optional content groups
   */
  VE: VisibilityExpression; 
  
  constructor() {
    super(dictTypes.OPTIONAL_CONTENT_MD);
  }  
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
