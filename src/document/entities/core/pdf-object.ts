export abstract class PdfObject {
  protected _id: number;
  get id(): number {
    return this._id;
  }

  protected constructor() {
    
  }

  abstract toArray(): Uint8Array;
}
