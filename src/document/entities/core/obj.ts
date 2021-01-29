import { ObjRef } from "./obj-ref";

export abstract class Obj {
  /** Unique object identifier by which other objects can refer to it */
  readonly ref: ObjRef;
  
  readonly array: Uint8Array;

  protected constructor() {
  }

  toArray(): Uint8Array {
    return null;
  };
}
