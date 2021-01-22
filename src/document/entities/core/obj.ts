import { ObjRef } from "./obj-ref";

export class Obj {
  /** Unique object identifier by which other objects can refer to it */
  ref: ObjRef;

  protected constructor() {
  }
}
