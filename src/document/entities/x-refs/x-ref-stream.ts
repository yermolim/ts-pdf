import { flatePredictors, streamFilters, xRefTypes } from "../../spec-constants";
import { CryptInfo } from "../../encryption/interfaces";
import { ParserResult } from "../../data-parse/data-parser";
import { ParserInfo } from "../../data-parse/parser-info";
import { HexString } from "../strings/hex-string";
import { ObjectId } from "../core/object-id";
import { DecodeParamsDict } from "../encoding/decode-params-dict";
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
    return this._trailerStream?.Info;
  }

  get encrypt(): ObjectId {
    return this._trailerStream?.Encrypt;
  }

  get id(): [HexString, HexString] {
    return this._trailerStream?.ID;
  }
  
  /**
   * 
   * @param trailer PDF trailer stream
   * @param offset byte offset
   */
  constructor(trailer: TrailerStream, offset: number) {
    super(xRefTypes.STREAM);
    this._trailerStream = trailer;
    this._offset = offset;
  }

  /**
   * create new cross-reference stream based on the specified one
   * @param base source cross-reference stream
   * @param entries new cross-reference stream entries
   * @param offset new cross-reference stream byte offset
   * @returns new cross-reference stream
   */
  static createFrom(base: XRefStream, entries: XRefEntry[], offset: number) {
    if (!entries?.length || !base) {
      return null;
    }

    // size shall point to the next free id
    // so +1 is to count the new xref id and another +1 to point to the next free value
    const entriesSize = Math.max(...entries.map(x => x.id)) + 2;
    const size = Math.max(entriesSize, base.size);

    return XRefStream.create(entries, size, offset, base.root, 
      base.offset, base.info, base.encrypt, base.id);
  }
  
  /**
   * create new cross-reference stream
   * @param entries new cross-reference stream entries
   * @param size max PDF document object id + 1
   * @param offset new cross-reference stream byte offset
   * @param root PDF object id of a document root
   * @param prev the previous cross-reference stream byte offset
   * @param info PDF object id of an information dictionary
   * @param encrypt PDF object id of an encryption dictionary
   * @param id PDF document id (tuple of two hex strings)
   * @returns new cross-reference stream
   */
  static create(entries: XRefEntry[], size: number, offset: number, root: ObjectId, 
    prev?: number, info?: ObjectId, encrypt?: ObjectId, id?: [HexString, HexString]): XRefStream {

    if (!entries?.length || !size || !offset || !root) {
      return null;
    }

    const trailer = new TrailerStream();
    trailer.Size = size;
    trailer.Root = root;
    trailer.Prev = prev;
    trailer.Info = info;
    trailer.Encrypt = encrypt;
    trailer.ID = id;

    const w: [number, number, number] = [1, 4, 2];
    const wSum = w[0] + w[1] + w[2];

    const params = new DecodeParamsDict();
    params.setIntProp("/Predictor", flatePredictors.PNG_UP);
    params.setIntProp("/Columns", wSum);
    params.setIntProp("/Colors", 1);
    params.setIntProp("/BitsPerComponent", 8);
    
    const data = XRefEntry.toStreamBytes(entries, w);
    const stream = new XRefStream(trailer, offset);
    stream._trailerStream.Filter = streamFilters.FLATE;
    stream._trailerStream.DecodeParms = params;
    stream._trailerStream.W = w;
    stream._trailerStream.Index = data.index;
    stream._trailerStream.streamData = data.bytes;

    return stream;
  }
  
  /**
   * parse 
   * @param parser PDF document data parser
   * @param offset CRS byte offset in the PDF document
   * @returns 
   */
  static parse(parseInfo: ParserInfo, offset: number): ParserResult<XRefStream> {
    if (!parseInfo) {
      return null;
    }
    
    const trailerStream = TrailerStream.parse(parseInfo);   
    if (!trailerStream) {
      return null;
    }

    const xrefStream = new XRefStream(trailerStream.value, offset);
  
    return {
      value: xrefStream,
      start: null,
      end: null,
    };
  }

  createUpdate(entries: XRefEntry[], offset: number): XRefStream {
    return XRefStream.createFrom(this, entries, offset);
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
    return this._trailerStream.toArray(cryptInfo);
  }
}
