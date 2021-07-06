import { keywordCodes } from "../../encoding/char-codes";
import { xRefTypes } from "../../spec-constants";
import { CryptInfo } from "../../encryption/interfaces";
import { DataParser, ParserResult } from "../../data-parse/data-parser";
import { HexString } from "../strings/hex-string";
import { ObjectId } from "../core/object-id";
import { TrailerDict } from "./trailer-dict";
import { XRef } from "./x-ref";
import { XRefEntry } from "./x-ref-entry";

/**PDF cross-reference table */
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

  /**
   * 
   * @param table CRT entries serialized to byte array
   * @param trailer PDF trailer dictionary
   * @param offset byte offset
   */
  constructor(table: Uint8Array, trailer: TrailerDict, offset: number) {
    super(xRefTypes.TABLE);

    this._table = table;
    this._trailerDict = trailer;
    this._offset = offset;
  }
  
  /**
   * create new cross-reference table based on the specified one
   * @param base source cross-reference table
   * @param entries new cross-reference table entries
   * @param offset new cross-reference table byte offset
   * @returns new cross-reference table
   */
  static createFrom(base: XRefTable, entries: XRefEntry[], offset: number): XRefTable {
    if (!entries?.length || !base) {
      return null;
    }
    
    const entriesSize = Math.max(...entries.map(x => x.id)) + 1;
    const size = Math.max(entriesSize, base.size);

    return XRefTable.create(entries, size, offset, base.root, 
      base.offset, base.info, base.encrypt, base.id);
  }
  
  /**
   * create new cross-reference table
   * @param entries new cross-reference table entries
   * @param size max PDF document object id + 1
   * @param offset new cross-reference table byte offset
   * @param root PDF object id of a document root
   * @param prev the previous cross-reference table byte offset
   * @param info PDF object id of an information dictionary
   * @param encrypt PDF object id of an encryption dictionary
   * @param id PDF document id (tuple of two hex strings)
   * @returns new cross-reference table
   */
  static create(entries: XRefEntry[], size: number, offset: number, root: ObjectId, 
    prev?: number, info?: ObjectId, encrypt?: ObjectId, id?: [HexString, HexString]): XRefTable {

    if (!entries?.length || !size || !offset || !root) {
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
    const table = new XRefTable(data, trailer, offset);

    return table;
  }

  /**
   * parse 
   * @param parser PDF document data parser
   * @param start parsing start byte offset in the parser data
   * @param offset CRT byte offset in the PDF document
   * @returns 
   */
  static async parseAsync(parser: DataParser, start: number, 
    offset: number): Promise<ParserResult<XRefTable>> {
    if (!parser || isNaN(start)) {
      return null;
    }

    const xrefTableBounds = await parser.getXrefTableBoundsAtAsync(start);
    if (!xrefTableBounds) {
      return null;
    }

    const trailerDictBounds = await parser.getDictBoundsAtAsync(xrefTableBounds.end + 1);
    if (!trailerDictBounds) {
      return null;
    }
    
    const table = parser.sliceCharCodes(xrefTableBounds.contentStart, 
      xrefTableBounds.contentEnd);    

    const trailerDict = await TrailerDict.parseAsync({parser, bounds: trailerDictBounds});   
    if (!trailerDict) {
      return null;
    }

    const xrefTable = new XRefTable(table, trailerDict.value, offset); 
  
    return {
      value: xrefTable,
      start: null,
      end: null,
    };
  }
  
  createUpdate(entries: XRefEntry[], offset: number): XRefTable {
    return XRefTable.createFrom(this, entries, offset);
  }
  
  getEntries(): Iterable<XRefEntry> { 
    if (!this._table.length) {
      return [];
    }
    
    const entries = XRefEntry.fromTableBytes(this._table);  
    return entries;
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const trailerBytes = this._trailerDict.toArray(cryptInfo); 

    const bytes: number[] = [
      ...keywordCodes.XREF_TABLE, ...keywordCodes.END_OF_LINE,
      ...this._table,
      ...keywordCodes.TRAILER, ...keywordCodes.END_OF_LINE,
      ...trailerBytes, ...keywordCodes.END_OF_LINE,
    ];  

    return new Uint8Array(bytes);
  }
}
