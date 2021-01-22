import { Obj } from "./obj";

export const streamTypes = {
  FORM_X_OBJECT: "/XObject",
  OBJECT_STREAM: "/ObjStm",
  METADATA_STREAM: "/Metadata",
} as const;
export type StreamType = typeof streamTypes[keyof typeof streamTypes];

export const userTypes = {
  INDIVIDUAL: "/Ind",
  TITLE: "/Title",
  ORGANIZATION: "/Org",
} as const;
export type UserTypes = typeof userTypes[keyof typeof userTypes];


export const dictObjTypes = {
  XREF: "/XRef",
  XOBJECT: "/XObject",
  PAGE_TREE: "/Pages",
  PAGE: "/Page",
  ANNOTATION: "/Annot",
  BORDER_STYLE: "/Border",
  OPTIONAL_CONTENT_GROUP: "/OCG",
  OPTIONAL_CONTENT_MD: "/OCMD",
  EXTERNAL_DATA: "/ExDATA",
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
