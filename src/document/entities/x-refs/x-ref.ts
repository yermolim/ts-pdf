import { XRefType } from "../../spec-constants";
import { CryptInfo, IEncodable } from "../../encryption/interfaces";
import { HexString } from "../strings/hex-string";
import { ObjectId } from "../core/object-id";
import { XRefEntry } from "./x-ref-entry";

/**
 * PDF cross-reference section base class
 */
export abstract class XRef implements IEncodable {
  protected readonly _type: XRefType;
  get type(): XRefType {
    return this._type;
  }
  protected _offset: number;
  get offset(): number {
    return this._offset;
  }

  /**max PDF object id + 1 */
  abstract get size(): number;
  /**previous CRS byte offset */
  abstract get prev(): number;
  /**PDF document root object id  */
  abstract get root(): ObjectId;
  /**PDF document info object id */
  abstract get info(): ObjectId;
  /**PDF document encryption dictionary object id  */
  abstract get encrypt(): ObjectId;
  /**PDF document id (tuple of two hex strings) */
  abstract get id(): [HexString, HexString];

  protected constructor(type: XRefType) {
    this._type = type;
  }
  
  /**
   * create a new cross-reference section based on the current one using the specified entries
   * @param entries cross-reference entries to be included in the new CRS
   * @param offset byte offset of the new section 
   * @returns the new cross-reference section
   */
  abstract createUpdate(entries: XRefEntry[], offset: number): XRef;

  /**
   * 
   * @returns cross-reference section entries
   */
  abstract getEntries(): Iterable<XRefEntry>;
  
  /**serialize the cross-reference section to a byte array */
  abstract toArray(cryptInfo?: CryptInfo): Uint8Array;
}
