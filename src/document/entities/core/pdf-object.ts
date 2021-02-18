import { CryptInfo, Encodable, Reference } from "../../interfaces";

export abstract class PdfObject implements Encodable {
  protected _ref: Reference;
  get ref(): Reference {
    return this._ref;
  }
  get id(): number {
    return this._ref.id;
  }
  get generation(): number {
    return this._ref.generation;
  }

  protected constructor() {
    
  }

  abstract toArray(cryptInfo?: CryptInfo): Uint8Array;
}
