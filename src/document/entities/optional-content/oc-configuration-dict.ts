import { CryptInfo } from "../../common-interfaces";
import { OcConfigState, ocConfigStates, OcIntent, ocIntents, 
  OcListMode, ocListModes } from "../../spec-constants";
import { PdfDict } from "../core/pdf-dict";
import { OcGroupDict } from "./oc-group-dict";
import { UsageDict } from "./usage-dict";
export class OcConfigurationDict extends PdfDict {
  /**
   * (Optional) A name for the configuration, 
   * suitable for presentation in a user interface
   */
  Name: string;
  /**
   * (Optional) Name of the application or feature that created this configuration dictionary
   */
  Creator: string;
  /**
   * (Optional) Used to initialize the states of all the optional content groups in a document 
   * when this configuration is applied. After this initialization, 
   * the contents of the ON and OFF arrays shall be processed, 
   * overriding the state of the groups included in the arrays
   */
  BaseState: OcConfigState = ocConfigStates.ON; 
  /**
   * (Optional)An array of optional content groups whose state shall be set to ON 
   * when this configuration is applied.
   * If the BaseState entry is ON, this entry is redundant
   */
  ON: OcGroupDict[];
  /**
   * (Optional)An array of optional content groups whose state shall be set to OFF 
   * when this configuration is applied.
   * If the BaseState entry is OFF, this entry is redundant
   */
  OFF: OcGroupDict[];
  /**
   * (Optional) A single intent name or an array containing any combination of names. 
   * It shall be used to determine which optional content groups’ states to consider 
   * and which to ignore in calculating the visibility of content
   */
  Intent: OcIntent | OcIntent[] = ocIntents.VIEW; 
  /**
   * (Optional) An array of usage application dictionaries specifying 
   * which usage dictionary categories shall be consulted by conforming readers 
   * to automatically set the states of optional content groups based on external factors, 
   * such as the current system language or viewing magnification, and when they shall be applied
   */
  AS: UsageDict[];
  /**
   * (Optional) An array specifying the order for presentation of optional content groups 
   * in a conforming reader’s user interface. Any groups not listed in this array 
   * shall not be presented in any user interface that uses the configuration
   */
  Order: (OcGroupDict | OcGroupDict[] | (string | OcGroupDict)[])[] = [];
  /**
   * (Optional) A name specifying which optional content groups 
   * in the Order array shall be displayed to the user
   */
  ListMode: OcListMode = ocListModes.ALL;
  /**
   * (Optional) An array consisting of one or more arrays, 
   * each of which represents a collection of optional content groups 
   * whose states shall be intended to follow a radio button paradigm
   */
  RBGroups: OcGroupDict[][] = [];
  /**
   * (Optional; PDF 1.6+) An array of optional content groups 
   * that shall be locked when this configuration is applied. 
   * The state of a locked group cannot be changed through the user interface 
   * of a conforming reader. Conforming writers can use this entry 
   * to prevent the visibility of content that depends on these groups 
   * from being changed by users
   */
  Locked: OcGroupDict[] = [];
  
  constructor() {
    super(null);
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
