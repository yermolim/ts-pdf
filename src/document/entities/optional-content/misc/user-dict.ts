import { UserTypes } from "../../../common/const";
import { PdfDict } from "../../core/pdf-dict";

export class UserDict extends PdfDict {
  /**
   * (Required)
   */
  Name: string;
  
  constructor(type: UserTypes) {
    super(type);
  }
}
