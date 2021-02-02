import { Dict } from "../../core/dict";

export class ZoomDict extends Dict {
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
