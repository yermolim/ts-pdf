import { ObjId } from "./obj-id";

export abstract class Obj {
  /** Unique object identifier by which other objects can refer to it */
  id: ObjId;

  protected constructor() {
  }

  toArray(): Uint8Array {
    return null;
  };
}
