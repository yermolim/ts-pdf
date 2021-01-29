import { DictObj, dictObjTypes } from "../core/dict-obj";
import { OcIntent } from "./oc-const";
import { OcUsageDict } from "./oc-usage-dict";

export class OcGroupDict extends DictObj {
  /**
   * (Required)The name of the optional content group, 
   * suitable for presentation in a reader’s user interface 
   */
  Name: string;
  /**
   * (Optional) A single intent name or an array containing any combination of names. 
   * PDF defines two names, View and Design, 
   * that may indicate the intended use of the graphics in the group. 
   * A conforming reader may choose to use only groups 
   * that have a specific intent and ignore others
   */
  Intent: OcIntent | OcIntent[]; 
  /**
   * (Optional) A usage dictionary 
   * describing the nature of the content controlled by the group
   */
  Usage: OcUsageDict; 
  
  constructor() {
    super(dictObjTypes.OPTIONAL_CONTENT_GROUP);
  }
}
