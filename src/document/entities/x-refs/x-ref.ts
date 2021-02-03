import { XRefType } from "../../common/const";
import { XRefEntry } from "./x-ref-entry";

export abstract class XRef {
  readonly _type: XRefType;
  public get type(): XRefType {
    return this._type;
  }

  abstract get prev(): number;

  protected constructor(type: XRefType) {
    this._type = type;
  }

  abstract getEntries(): XRefEntry[];
}
