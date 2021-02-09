import { xRefTypes } from "../../common/const";
import { ParseInfo, ParseResult } from "../../parser/data-parser";
import { ObjectId } from "../common/object-id";
import { TrailerStream } from "./trailer-stream";
import { XRef } from "./x-ref";
import { XRefEntry } from "./x-ref-entry";

export class XRefStream extends XRef {
  private _trailerStream: TrailerStream;

  get prev(): number {
    return this._trailerStream?.Prev;
  }
  
  get size(): number {
    return this._trailerStream?.Size;
  }
  
  get root(): ObjectId {
    return this._trailerStream?.Root;
  }
  
  constructor(trailer: TrailerStream) {
    super(xRefTypes.STREAM);
    this._trailerStream = trailer;
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<XRefStream> {
    if (!parseInfo) {
      return null;
    }
    
    const trailerStream = TrailerStream.parse(parseInfo);   
    if (!trailerStream) {
      return null;
    }

    const xrefStream = new XRefStream(trailerStream.value);
  
    return {
      value: xrefStream,
      start: null,
      end: null,
    };
  }

  getEntries(): Iterable<XRefEntry> {   
    if (!this._trailerStream) {
      return [];
    }

    const entries = XRefEntry.fromStreamBytes(
      this._trailerStream.decodedStreamData, 
      this._trailerStream.W, 
      this._trailerStream.Index);
    return entries;
  }
}
