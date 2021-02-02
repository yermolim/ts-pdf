import { Dict } from "../core/dict";
import { XFormStream } from "../streams/x-form-stream";

export const appearanceStates = {
  ON: "/ON",
  OFF: "/OFF",
} as const;
export type AppearanceState = typeof appearanceStates[keyof typeof appearanceStates];

export class AppearanceDict extends Dict {
  /**
   * (Required) The annotation’s normal appearance 
   */
  N: Dict | XFormStream;
  /**
   * (Optional) The annotation’s rollover appearance
   */
  R: Dict | XFormStream; 
  /**
   * (Optional) The annotation’s down appearance
   */
  D: Dict | XFormStream; 
  
  constructor() {
    super(null);
  }
}
