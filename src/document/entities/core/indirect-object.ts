import { Dict } from "./dict";
import { Stream } from "./stream";
import { IndirectObjectInfo } from "./indirect-object-info";

export abstract class IndirectObject {
  readonly info: IndirectObjectInfo;

  protected constructor(info: IndirectObjectInfo) {
    this.info = info;
  }

  abstract toArray(): Uint8Array;
}

export class IndirectArrayObject extends IndirectObject {
  content: []; 

  constructor(info: IndirectObjectInfo) {
    super(info);
  }

  toArray(): Uint8Array {
    return null;
  };
}

export class IndirectDictObject<T extends Dict> extends IndirectObject {
  content: T; 

  constructor(info: IndirectObjectInfo) {
    super(info);
  }

  toArray(): Uint8Array {
    return null;
  };
}

export abstract class IndirectStreamObject extends IndirectObject {
  protected constructor(info: IndirectObjectInfo) {
    super(info);
  }
}
