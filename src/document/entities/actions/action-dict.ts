import { dictTypes } from "../../const";
import { PdfDict } from "../core/pdf-dict";

export const actionTypes = {
  GO_TO: "/GoTo",
  GO_TO_REMOTE_DOC: "/GoToR",
  GO_TO_EMBEDDED_FILE: "/GoToE",
  LAUNCH_APP: "/Launch",
  READ_THREAD: "/Thread",
  RESOLVE_URI: "/URI",
  PLAY_SOUND: "/Sound",
  PLAY_MOVIE: "/Movie",
  HIDE: "/Hide",
  EXECUTE_READER_SPECIFIC_ACTION: "/Named",
  FORM_SUBMIT: "/SubmitForm",
  FORM_RESET: "/ResetForm",
  IMPORT_FROM_FILE: "/ImportData",
  EXECUTE_JS: "/JavaScript",
  SET_OCG_STATES: "/SetOCGState",
  RENDITION: "/Rendition",
  TRANSITION: "/Trans",
  GO_TO_3D_VIEW: "/GoTo3DView",
} as const;
export type ActionType = typeof actionTypes[keyof typeof actionTypes];

export class ActionDict extends PdfDict {
  /**(Required) The type of action that this dictionary describes */
  readonly S: ActionType;
  /**
   * (Optional; PDF 1.2+)The next action or sequence of actions 
   * that shall be performed after the action represented by this dictionary. 
   * The value is either a single action dictionary or an array of action dictionaries 
   * that shall be performed in order
   */
  D: ActionDict | ActionDict[];
  
  constructor(type: ActionType) {
    super(dictTypes.ACTION);

    this.S = type;
  }
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
