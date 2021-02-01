import { DictObjType } from "../../const";
import { Obj } from "./obj";

export class DictObj extends Obj {
  /** (Optional) The  type  of  PDF  object  that  this  dictionary  describes */
  readonly Type: DictObjType;

  protected readonly _customProps = new Map<string, any>();
  get customProps(): Map<string, any>{
    return new Map<string, any>(this._customProps);
  }

  protected constructor(type: DictObjType) {
    super();
    this.Type = type;
  }
}
