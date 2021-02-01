import { dictObjTypes } from "../../common/const";
import { FlateParamsDict } from "./flate-params-dict";

export class LzwParamsDict extends FlateParamsDict {
  /**
   * An indication of when to increase the code length. 
   * If the value of this entry is 0, code length increases shall be postponed 
   * as long as possible. If the value is 1, code length increases 
   * shall occur one code early. This parameter is included because 
   * LZW sample code distributed by some vendors increases the code length 
   * one code earlier than necessary
   */
  EarlyChange = 1;
  
  constructor() {
    super();
  }
}
