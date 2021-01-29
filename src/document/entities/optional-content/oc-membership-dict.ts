import { DictObj, dictObjTypes } from "../core/dict-obj";
import { OcGroupDict } from "./oc-group-dict";
import { VisibilityExpression } from "./misc/visibility-expression";
import { VisibilityPolicy, visibilityPolicies } from "./oc-const";

export class OcMembershipDict extends DictObj {
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
    super(dictObjTypes.OPTIONAL_CONTENT_MD);
  }
}
