import { DictObj } from "../core/dict-obj";
import { XFormStream } from "../streams/x-form-stream";

export const appearanceStates = {
  ON: "/ON",
  OFF: "/OFF",
} as const;
export type AppearanceState = typeof appearanceStates[keyof typeof appearanceStates];

export class AppearanceDict extends DictObj {
  /**
   * (Required) The annotation’s normal appearance 
   */
  N: DictObj | XFormStream;
  /**
   * (Optional) The annotation’s rollover appearance
   */
  R: DictObj | XFormStream; 
  /**
   * (Optional) The annotation’s down appearance
   */
  D: DictObj | XFormStream; 
  
  constructor() {
    super(null);
  }
}
