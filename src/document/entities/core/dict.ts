import { DictType } from "../../common/const";

export class Dict {
  /** (Optional) The  type  of  PDF  object  that  this  dictionary  describes */
  readonly Type: DictType;

  protected readonly _customProps = new Map<string, any>();
  get customProps(): Map<string, any>{
    return new Map<string, any>(this._customProps);
  }

  protected constructor(type: DictType) {
    this.Type = type;
  }
}
