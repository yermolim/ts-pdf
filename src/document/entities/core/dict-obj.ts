import { StreamType, UserTypes } from "../../const";
import { Obj } from "./obj";

export const dictObjTypes = {
  XREF: "/XRef",
  XOBJECT: "/XObject",
  CATALOG: "/Catalog",
  PAGE_TREE: "/Pages",
  PAGE: "/Page",
  ANNOTATION: "/Annot",
  BORDER_STYLE: "/Border",
  OPTIONAL_CONTENT_GROUP: "/OCG",
  OPTIONAL_CONTENT_MD: "/OCMD",
  EXTERNAL_DATA: "/ExDATA",
  ACTION: "/Action",
  MEASURE: "/Measure",
  DEV_EXTENSIONS: "/DeveloperExtensions",
} as const;
export type DictObjType = typeof dictObjTypes[keyof typeof dictObjTypes]
  | StreamType | UserTypes;

export class DictObj extends Obj {
  /** (Optional) The  type  of  PDF  object  that  this  dictionary  describes */
  readonly Type: DictObjType;

  protected readonly _customProps = new Map<string, any>();
  get customProps(): Map<string, any>{
    return new Map<string, any>(this._customProps);
  }

  protected constructor(type: DictObjType) {
    super(); 
    
    if (!type) {
      throw new Error("Type not defined");
    }
    this.Type = type;
  }
}
