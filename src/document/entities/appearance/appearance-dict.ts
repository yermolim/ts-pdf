import { DictObj } from "../core/dict-obj";
import { xFormStream } from "../streams/x-form-stream";

export const appearanceStates = {
  ON: "/ON",
  OFF: "/OFF",
} as const;
export type AppearanceState = typeof appearanceStates[keyof typeof appearanceStates];

export class AppearanceDict extends DictObj {
  /**
   * (Required) The annotation’s normal appearance 
   */
  N: DictObj | xFormStream;
  /**
   * (Optional) The annotation’s rollover appearance
   */
  R: DictObj | xFormStream; 
  /**
   * (Optional) The annotation’s down appearance
   */
  D: DictObj | xFormStream; 
  
  constructor() {
    super(null);
  }
}
