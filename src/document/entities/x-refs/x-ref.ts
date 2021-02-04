import { XRefType } from "../../common/const";
import { ObjectId } from "../common/object-id";
import { XRefEntry } from "./x-ref-entry";

export abstract class XRef {
  readonly _type: XRefType;
  public get type(): XRefType {
    return this._type;
  }

  abstract get prev(): number;
  abstract get size(): number;
  abstract get root(): ObjectId;

  protected constructor(type: XRefType) {
    this._type = type;
  }

  abstract getEntries(): Iterable<XRefEntry>;
}
