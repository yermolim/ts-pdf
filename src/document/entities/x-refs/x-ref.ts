import { XRefType } from "../../const";
import { CryptInfo, IEncodable } from "../../common-interfaces";
import { HexString } from "../strings/hex-string";
import { ObjectId } from "../core/object-id";
import { XRefEntry } from "./x-ref-entry";

export abstract class XRef implements IEncodable {
  protected readonly _type: XRefType;
  get type(): XRefType {
    return this._type;
  }
  protected _offset: number;
  get offset(): number {
    return this._offset;
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
  
  abstract createUpdate(entries: XRefEntry[], offset: number): XRef;

  abstract getEntries(): Iterable<XRefEntry>;
  
  abstract toArray(cryptInfo?: CryptInfo): Uint8Array;
}
