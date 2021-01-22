import { DictObj } from "../../core/dict-obj";

export class ZoomDict extends DictObj {
  /**
   * (Required) The minimum recommended magnification factor 
   * at which the group shall be ON
   */
  min = 0;
  /**
   * (Required) The magnification factor below which the group shall be ON
   */
  max = Infinity;
  
  constructor() {
    super(null);
  }
}
