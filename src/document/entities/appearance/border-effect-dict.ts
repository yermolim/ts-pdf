import { DictObj } from "../core/dict-obj";

export const borderEffects = {
  NONE: "/S",
  CLOUDY: "/C",
};

export class BorderEffectDict extends DictObj {
  /**(Optional) A name representing the border effect to apply */
  S = borderEffects.NONE;
  /**(Optional; valid only if the value of S is C) 
   * A number describing the intensity of the effect, in the range 0 to 2 */
  L = 0;
  
  constructor() {
    super(null);
  }
}
