import { codes, keywordCodes } from "./codes";
import { CryptInfo, IEncodable } from "./common-interfaces";

export class DataWriter {
  private readonly _data: number[];  
  private _pointer: number;

  private _encoder: TextEncoder;

  /**
   * return the next byte position (the current last byte position + 1)
   */
  public get offset(): number {
    return this._pointer;
  }

  /**
   * 
   * @param data byte array of the file to be modified (will be copied without modification)
   */
  constructor(data: Uint8Array) {
    if (!data?.length) {
      throw new Error("Data is empty");
    }
    this._data = [...data];
    this._pointer = data.length;

    this._encoder = new TextEncoder();

    this.fixEof();
  }

  /**
   * 
   * @returns a copy of the underlying data byte array in its current state
   */
  getCurrentData(): Uint8Array {
    return new Uint8Array(this._data);
  }

  /**
   * append byte array to the current data
   * @param bytes
   */
  writeBytes(bytes: Uint8Array | number[]) {
    if (!bytes?.length) {
      return;
    }
    this._data.push(...bytes);
    this._pointer += bytes.length;
  }
  
  /**
   * convert an encodable object to a byte array and append it to the underlying data
   * @param cryptInfo 
   * @param obj 
   */
  writeIndirectObject(cryptInfo: CryptInfo, obj: IEncodable) {
    if (!cryptInfo?.ref || !obj) {
      return;
    }

    const objBytes = [
      ...this._encoder.encode(`${cryptInfo.ref.id} ${cryptInfo.ref.generation} `), 
      ...keywordCodes.OBJ, ...keywordCodes.END_OF_LINE,
      ...obj.toArray(cryptInfo), ...keywordCodes.END_OF_LINE,
      ...keywordCodes.OBJ_END, ...keywordCodes.END_OF_LINE,
    ];

    this.writeBytes(objBytes);
  }

  /**
   * convert an array of encodable objects to a byte array and append it to the underlying data
   * @param cryptInfo 
   * @param objs
   */
  writeIndirectArray(cryptInfo: CryptInfo, objs: IEncodable[]) {
    if (!cryptInfo?.ref || !objs) {
      return;
    }
    
    const objBytes = [
      ...this._encoder.encode(`${cryptInfo.ref.id} ${cryptInfo.ref.generation} `), 
      ...keywordCodes.OBJ, ...keywordCodes.END_OF_LINE,
      codes.L_BRACKET, 
    ];

    for (const obj of objs) {
      objBytes.push(
        codes.WHITESPACE,
        ...obj.toArray(cryptInfo),
      );
    }

    objBytes.push(
      codes.R_BRACKET, ...keywordCodes.END_OF_LINE,
      ...keywordCodes.OBJ_END, ...keywordCodes.END_OF_LINE,
    );

    this.writeBytes(objBytes);
  }

  /**
   * append the eod-of-file byte sequence to the current data 
   */
  writeEof(xrefOffset: number) {
    const eof = [
      ...keywordCodes.XREF_START, ...keywordCodes.END_OF_LINE,
      ...this._encoder.encode(xrefOffset + ""), ...keywordCodes.END_OF_LINE,
      ...keywordCodes.END_OF_FILE, ...keywordCodes.END_OF_LINE
    ];

    this.writeBytes(eof);
  }

  /**
   * append '\r\n' to the end of the current data if absent
   */
  private fixEof() {
    if (this._data[this._pointer - 1] !== codes.LINE_FEED) {
      if (this._data[this._pointer - 2] !== codes.CARRIAGE_RETURN) {
        this._data.push(codes.CARRIAGE_RETURN, codes.LINE_FEED);
        this._pointer += 2;
      } else {        
        this._data.push(codes.LINE_FEED);
        this._pointer += 1;
      }
    }
  }
}
