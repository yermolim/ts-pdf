import { Dict } from "./dict";
import { Stream } from "./stream";
import { IndirectObjectParseInfo } from "./indirect-object-parse-info";

export abstract class IndirectObject {
  readonly parseInfo: IndirectObjectParseInfo;

  protected constructor(parseInfo?: IndirectObjectParseInfo) {
    this.parseInfo = parseInfo;
  }

  abstract toArray(): Uint8Array;
}

export class IndirectArrayObject extends IndirectObject {
  content: []; 

  constructor(parseInfo?: IndirectObjectParseInfo) {
    super(parseInfo);
  }

  toArray(): Uint8Array {
    return null;
  };
}

export class IndirectDictObject<T extends Dict> extends IndirectObject {
  content: T; 

  constructor(parseInfo?: IndirectObjectParseInfo) {
    super(parseInfo);
  }

  toArray(): Uint8Array {
    return null;
  };
}

export abstract class IndirectStreamObject extends IndirectObject {
  protected constructor(parseInfo?: IndirectObjectParseInfo) {
    super(parseInfo);
  }
}
