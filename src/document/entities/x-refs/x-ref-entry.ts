import { parseIntFromBytes } from "../../../common/utils";
import { codes, DIGIT_CHARS } from "../../common/codes";
import { XRefEntryType, xRefEntryTypes } from "../../common/const";

export class XRefEntry {

  constructor(
    readonly type: XRefEntryType,
    readonly generation?: number,
    readonly byteOffset?: number,
    readonly nextFreeId?: number,
    readonly objectId?: number,
    readonly streamId?: number,
    readonly streamIndex?: number) { }   
    
  static parseFromTable(bytes: Uint8Array): XRefEntry[] {
    const entries: XRefEntry[] = [];

    let i = 0;
    let j = 0;
    while (i < bytes.length) {
      const firstIndexBytes: number[] = [];
      let firstIndexDigit = bytes[i++];
      while (DIGIT_CHARS.has(firstIndexDigit)) {
        firstIndexBytes.push(firstIndexDigit);
        firstIndexDigit = bytes[i++];
      }
      let firstIndex = parseInt(firstIndexBytes.map(x => String.fromCharCode(x)).join(""), 10);

      const countBytes: number[] = [];
      let countDigit = bytes[i++];
      while (DIGIT_CHARS.has(countDigit)) {
        countBytes.push(countDigit);
        countDigit = bytes[i++];
      }
      const count = parseInt(countBytes.map(x => String.fromCharCode(x)).join(""), 10);

      i++;
      for (j = 0; j < count; j++) {
        const value = parseInt(Array.from(bytes.slice(i, i + 10))
          .map(x => String.fromCharCode(x)).join(""), 10);
        i += 11;
        const gen = parseInt(Array.from(bytes.slice(i, i + 5))
          .map(x => String.fromCharCode(x)).join(""), 10);
        i += 6;        
        const typeByte = bytes[i];
        if (typeByte === codes.f) {
          entries.push(new XRefEntry(xRefEntryTypes.FREE, gen, null, value, firstIndex++));
        } else if (typeByte === codes.n) {
          entries.push(new XRefEntry(xRefEntryTypes.NORMAL, gen, value, null, firstIndex++));
        }
        i += 3;
      }
    }

    return entries;
  } 

  static parseFromStream(bytes: Uint8Array, w1 = 1, w2 = 3, w3 = 1): XRefEntry[] {
    const entryLength = w1 + w2 + w3;
    if (bytes.length % entryLength) {
      throw new Error("Incorrect stream length");
    }

    const entries: XRefEntry[] = new Array(entryLength);

    let i = 0; 
    let j = 0; 
    while (i < bytes.length) {
      const type = parseIntFromBytes(bytes.slice(i, i + w1));
      i += w1;
      const value1 = parseIntFromBytes(bytes.slice(i, i + w2));
      i += w2;
      const value2 = parseIntFromBytes(bytes.slice(i, i + w3));
      i += w3;

      switch (type) {
        case xRefEntryTypes.FREE:
          entries[j++] = new XRefEntry(xRefEntryTypes.FREE, value2, null, value1);
          break;
        case xRefEntryTypes.NORMAL:
          entries[j++] = new XRefEntry(xRefEntryTypes.NORMAL, value2, value1);
          break;
        case xRefEntryTypes.COMPRESSED:
          entries[j++] = new XRefEntry(xRefEntryTypes.COMPRESSED, null, null, null, value1, value2);
          break;
        default:
          // treat other types as an absence of entry
          break;
      }
    }

    return entries;
  }

  toTableBytes(): Uint8Array {
    // TODO: Implement
    return null;
  }

  toStreamBytes(w1: number, w2: number, w3: number): Uint8Array {
    // TODO: Implement
    return null;
  }
}
