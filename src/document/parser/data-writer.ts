import { codes, keywordCodes } from "../common/codes";

export class DataWriter {
  private readonly _data: number[];  
  private _pointer: number;

  private _encoder: TextEncoder;

  public get maxIndex(): number {
    return this._pointer;
  }

  constructor(data: Uint8Array) {
    if (!data?.length) {
      throw new Error("Data is empty");
    }
    this._data = [...data];
    this._pointer = data.length - 1;

    this._encoder = new TextEncoder();

    this.fixEof();
  }

  getCurrentData(): Uint8Array {
    return new Uint8Array(this._data);
  }

  writeBytes(bytes: Uint8Array | number[]) {
    if (!bytes?.length) {
      return;
    }
    this._data.push(...bytes);
    this._pointer += bytes.length;
  }

  writeEof(xrefOffset: number) {
    const eof = [...keywordCodes.XREF_START, ...keywordCodes.END_OF_LINE,
      ...keywordCodes.END_OF_LINE, ...this._encoder.encode(xrefOffset + ""),
      ...keywordCodes.END_OF_FILE, ...keywordCodes.END_OF_LINE];
    this._data.push(...eof);
    this._pointer += eof.length;
  }

  /**
   * append \r\n to the end of data if absent
   */
  private fixEof() {
    if (this._data[this._pointer] !== codes.LINE_FEED) {
      if (this._data[this._pointer - 1] !== codes.CARRIAGE_RETURN) {
        this._data.push(codes.CARRIAGE_RETURN, codes.LINE_FEED);
        this._pointer += 2;
      } else {        
        this._data.push(codes.LINE_FEED);
        this._pointer += 1;
      }
    }
  }
}
