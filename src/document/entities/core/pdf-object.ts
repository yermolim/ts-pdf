export abstract class PdfObject {

  protected constructor() {
    
  }

  abstract toArray(): Uint8Array;
}
