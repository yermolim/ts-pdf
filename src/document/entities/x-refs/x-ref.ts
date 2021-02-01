import { XRefType } from "../../common/const";

export abstract class XRef {
  readonly _type: XRefType;
  public get type(): XRefType {
    return this._type;
  }

  protected constructor(type: XRefType) {
    this._type = type;
  }
}
