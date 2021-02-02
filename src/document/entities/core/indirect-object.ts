import { Dict } from "./dict";
import { IndirectObjectId } from "./indirect-object-id";

export class IndirectObject<T extends Dict> {
  id: IndirectObjectId;
  dict: T;

  constructor() {
  }

  toArray(): Uint8Array {
    return null;
  };
}
