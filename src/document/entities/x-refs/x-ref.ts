import { XRefType } from "../../common/const";
import { HexString } from "../common/hex-string";
import { ObjectId } from "../common/object-id";
import { XRefEntry } from "./x-ref-entry";

export abstract class XRef {
  protected readonly _type: XRefType;
  public get type(): XRefType {
    return this._type;
  }

  abstract get size(): number;
  abstract get prev(): number;
  abstract get root(): ObjectId;
  abstract get info(): ObjectId;
  abstract get encrypt(): ObjectId;
  abstract get id(): [HexString, HexString];

  protected constructor(type: XRefType) {
    this._type = type;
  }
  
  abstract createUpdate(entries: XRefEntry[]): XRef;

  abstract getEntries(): Iterable<XRefEntry>;
  
  abstract toArray(): Uint8Array;
}
