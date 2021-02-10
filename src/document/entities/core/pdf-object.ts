export abstract class PdfObject {
  protected _id: number;
  get id(): number {
    return this._id;
  }
  protected _generation: number;
  get generation(): number {
    return this._generation;
  }

  protected constructor() {
    
  }

  abstract toArray(): Uint8Array;
}
