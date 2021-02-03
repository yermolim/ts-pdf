import { PdfDict } from "../core/pdf-dict";
import { XFormStream } from "../streams/x-form-stream";

export const appearanceStates = {
  ON: "/ON",
  OFF: "/OFF",
} as const;
export type AppearanceState = typeof appearanceStates[keyof typeof appearanceStates];

export class AppearanceDict extends PdfDict {
  /**
   * (Required) The annotation’s normal appearance 
   */
  N: PdfDict | XFormStream;
  /**
   * (Optional) The annotation’s rollover appearance
   */
  R: PdfDict | XFormStream; 
  /**
   * (Optional) The annotation’s down appearance
   */
  D: PdfDict | XFormStream; 
  
  constructor() {
    super(null);
  }
}
