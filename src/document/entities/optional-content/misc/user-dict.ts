import { UserTypes } from "../../../const";
import { DictObj } from "../../core/dict-obj";

export class UserDict extends DictObj {
  /**
   * (Required)
   */
  Name: string;
  
  constructor(type: UserTypes) {
    super(type);
  }
}
