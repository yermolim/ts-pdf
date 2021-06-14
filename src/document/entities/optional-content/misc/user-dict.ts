import { UserTypes } from "../../../spec-constants";
import { CryptInfo } from "../../../encryption/interfaces";
import { PdfDict } from "../../core/pdf-dict";

export class UserDict extends PdfDict {
  /**
   * (Required)
   */
  Name: string;
  
  constructor(type: UserTypes) {
    super(type);
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
