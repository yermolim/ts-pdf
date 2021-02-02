import { UserTypes } from "../../../common/const";
import { Dict } from "../../core/dict";

export class UserDict extends Dict {
  /**
   * (Required)
   */
  Name: string;
  
  constructor(type: UserTypes) {
    super(type);
  }
}
