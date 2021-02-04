import { parseIntFromBytes } from "../../../common/utils";
import { codes, DIGIT_CHARS } from "../../common/codes";
import { XRefEntryType, xRefEntryTypes } from "../../common/const";

export class XRefEntry {

  constructor(readonly type: XRefEntryType,
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

  static parseFromStream(bytes: Uint8Array, w: [number, number, number],
    index?: number[]): XRefEntry[] {
    const [w1, w2, w3] = w;
    const entryLength = w1 + w2 + w3;   
    
    console.log(bytes);

    if (bytes.length % entryLength) {
      throw new Error("Incorrect stream length");
    }

    const count = bytes.length / entryLength;
    const entries: XRefEntry[] = new Array(count);

    const ids: number[] = new Array(count).fill(null);
    if (index?.length) {
      let id: number;
      let n: number;
      let m = 0;
      for (let k = 0; k < index.length; k++) {
        if (!(k % 2)) {
          id = index[k];
        } else {
          for (n = 0; n < index[k]; n++) {
            ids[m++] = id + n;
          }
        }
      }
    }

    let i = 0; 
    let j = 0; 
    let type: number;
    let value1: number;
    let value2: number;
    while (i < bytes.length) {
      type = w1 
        ? parseIntFromBytes(bytes.slice(i, i + w1))
        : 1;
      i += w1;
      value1 = parseIntFromBytes(bytes.slice(i, i + w2));
      i += w2;
      value2 = w3 
        ? parseIntFromBytes(bytes.slice(i, i + w3))
        : null;
      i += w3;

      switch (type) {
        case xRefEntryTypes.FREE:
          entries[j] = new XRefEntry(xRefEntryTypes.FREE, value2, null, value1, ids[j++]);
          break;
        case xRefEntryTypes.NORMAL:
          entries[j] = new XRefEntry(xRefEntryTypes.NORMAL, value2 ?? 0, value1, null, ids[j++]);
          break;
        case xRefEntryTypes.COMPRESSED:
          entries[j] = new XRefEntry(xRefEntryTypes.COMPRESSED, 0, null, null, ids[j++], value1, value2);
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

  toStreamBytes(w: [number, number, number]): Uint8Array {
    // TODO: Implement
    return null;
  }
}
