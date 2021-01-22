import { DictObj } from "../core/dict-obj";
import { OcConfigurationDict } from "./oc-configuration-dict";
import { OcGroupDict } from "./oc-group-dict";

export class OcPropertiesDict extends DictObj {
  /**
   * (Required) An array of indirect references to all the optional content groups 
   * in the document, in any order. Every optional content group shall be included in this array
   */
  OCGs: OcGroupDict[];
  /**
   * (Required) The default viewing optional content configuration dictionary
   */
  D: OcConfigurationDict; 
  /**
   * (Optional) An array of alternate optional content configuration dictionaries
   */
  Configs: OcConfigurationDict[]; 
  
  constructor() {
    super(null);
  }
}
