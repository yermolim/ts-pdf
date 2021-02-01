import { ObjId } from "./obj-id";

export abstract class Obj {
  /** Unique object identifier by which other objects can refer to it */
  readonly id: ObjId;
  
  readonly array: Uint8Array;

  protected constructor() {
  }

  toArray(): Uint8Array {
    return null;
  };
}
