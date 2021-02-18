import { flatePredictors, streamFilters, xRefTypes } from "../../const";
import { CryptInfo } from "../../interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { HexString } from "../common/hex-string";
import { ObjectId } from "../common/object-id";
import { FlateParamsDict } from "../encoding/flate-params-dict";
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

  get info(): ObjectId {
    return this._trailerStream?.Root;
  }

  get encrypt(): ObjectId {
    return this._trailerStream?.Encrypt;
  }

  get id(): [HexString, HexString] {
    return this._trailerStream?.ID;
  }
  
  constructor(trailer: TrailerStream) {
    super(xRefTypes.STREAM);
    this._trailerStream = trailer;
  }

  static createFrom(base: XRefStream, entries: XRefEntry[]) {
    if (!entries?.length || !base) {
      return null;
    }

    const entriesSize = Math.max(...entries.map(x => x.id)) + 1;
    const size = Math.max(entriesSize, base.size);

    return XRefStream.create(entries, size, base.prev, base.root, 
      base.info, base.encrypt, base.id);
  }

  static create(entries: XRefEntry[], size: number, prev: number, root: ObjectId, 
    info?: ObjectId, encrypt?: ObjectId, id?: [HexString, HexString]): XRefStream {

    if (!entries?.length || !size || !prev || !root) {
      return null;
    }

    const trailer = new TrailerStream();
    trailer.Size = size;
    trailer.Prev = prev;
    trailer.Root = root;
    trailer.Info = info;
    trailer.Encrypt = encrypt;
    trailer.ID = id;

    const w: [number, number, number] = [1, 4, 2];
    const data = XRefEntry.toStreamBytes(entries, w);

    const params = new FlateParamsDict();
    params.Predictor = flatePredictors.PNG_UP;
    params.Columns = 5;
    params.Colors = 1;
    params.BitsPerComponent = 8;

    const stream = new XRefStream(trailer);
    stream._trailerStream.Filter = streamFilters.FLATE;
    stream._trailerStream.DecodeParms = params;
    stream._trailerStream.W = w;
    stream._trailerStream.Index = data.index;
    stream._trailerStream.streamData = data.bytes;

    return stream;
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

  createUpdate(entries: XRefEntry[]): XRefStream {
    return XRefStream.createFrom(this, entries);
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
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    return this._trailerStream.toArray();
  }
}
