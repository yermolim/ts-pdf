import { keywordCodes } from "../../common/codes";
import { xRefTypes } from "../../common/const";
import { DataParser, ParseResult } from "../../parser/data-parser";
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

  constructor(table: Uint8Array, trailer: TrailerDict) {
    super(xRefTypes.TABLE);

    this._table = table;
    this._trailerDict = trailer;
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
  
  getEntries(): Iterable<XRefEntry> { 
    if (!this._table.length) {
      return [];
    }
    
    const entries = XRefEntry.fromTableBytes(this._table);  
    return entries;
  }
  
  toArray(): Uint8Array {
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
