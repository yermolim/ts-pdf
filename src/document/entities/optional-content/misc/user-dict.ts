import { UserTypes } from "../../../const";
import { DataCryptor } from "../../../crypto";
import { PdfDict } from "../../core/pdf-dict";

export class UserDict extends PdfDict {
  /**
   * (Required)
   */
  Name: string;
  
  constructor(type: UserTypes) {
    super(type);
  }
  
  toArray(cryptor?: DataCryptor): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
