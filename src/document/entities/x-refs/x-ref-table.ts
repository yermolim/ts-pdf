import { keywordCodes } from "../../codes";
import { xRefTypes } from "../../const";
import { CryptInfo } from "../../interfaces";
import { DataParser, ParseResult } from "../../parser/data-parser";
import { HexString } from "../common/hex-string";
import { ObjectId } from "../common/object-id";
import { TrailerDict } from "./trailer-dict";
import { XRef } from "./x-ref";
import { XRefEntry } from "./x-ref-entry";

export class XRefTable extends XRef {
  private _trailerDict: TrailerDict;
  private _table: Uint8Array;

  get prev(): number {
    return this._trailerDict?.Prev;
  }
  
  get size(): number {
    return this._trailerDict?.Size;
  }
  
  get root(): ObjectId {
    return this._trailerDict?.Root;
  }

  get info(): ObjectId {
    return this._trailerDict?.Root;
  }

  get encrypt(): ObjectId {
    return this._trailerDict?.Encrypt;
  }

  get id(): [HexString, HexString] {
    return this._trailerDict?.ID;
  }

  constructor(table: Uint8Array, trailer: TrailerDict) {
    super(xRefTypes.TABLE);

    this._table = table;
    this._trailerDict = trailer;
  }
  
  static createFrom(base: XRefTable, entries: XRefEntry[]) {
    if (!entries?.length || !base) {
      return null;
    }
    
    const entriesSize = Math.max(...entries.map(x => x.id)) + 1;
    const size = Math.max(entriesSize, base.size);

    return XRefTable.create(entries, size, base.prev, 
      base.root, base.info, base.encrypt, base.id);
  }
  
  static create(entries: XRefEntry[], size: number, prev: number, root: ObjectId, 
    info?: ObjectId, encrypt?: ObjectId, id?: [HexString, HexString],) {

    if (!entries?.length || !size || !prev || !root) {
      return null;
    }

    const trailer = new TrailerDict();
    trailer.Size = size;
    trailer.Prev = prev;
    trailer.Root = root;
    trailer.Info = info;
    trailer.Encrypt = encrypt;
    trailer.ID = id;

    const data = XRefEntry.toTableBytes(entries);
    const table = new XRefTable(data, trailer);

    return table;
  }

  static parse(parser: DataParser, start: number): ParseResult<XRefTable> {
    if (!parser || isNaN(start)) {
      return null;
    }

    const xrefTableBounds = parser.getXrefTableBoundsAt(start);
    if (!xrefTableBounds) {
      return null;
    }

    const trailerDictBounds = parser.getDictBoundsAt(xrefTableBounds.end + 1);
    if (!trailerDictBounds) {
      return null;
    }
    
    const table = parser.sliceCharCodes(xrefTableBounds.contentStart, 
      xrefTableBounds.contentEnd);    

    const trailerDict = TrailerDict.parse({parser, bounds: trailerDictBounds});   
    if (!trailerDict) {
      return null;
    }

    const xrefTable = new XRefTable(table, trailerDict.value); 
  
    return {
      value: xrefTable,
      start: null,
      end: null,
    };
  }
  
  createUpdate(entries: XRefEntry[]): XRefTable {
    return XRefTable.createFrom(this, entries);
  }
  
  getEntries(): Iterable<XRefEntry> { 
    if (!this._table.length) {
      return [];
    }
    
    const entries = XRefEntry.fromTableBytes(this._table);  
    return entries;
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const trailerBytes = this._trailerDict.toArray(); 

    const bytes: number[] = [
      ...keywordCodes.XREF_TABLE, ...keywordCodes.END_OF_LINE,
      ...this._table,
      ...keywordCodes.TRAILER, ...keywordCodes.END_OF_LINE,
      ...trailerBytes, ...keywordCodes.END_OF_LINE,
    ];  

    return new Uint8Array(bytes);
  }
}
