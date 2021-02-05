import { parseIntFromBytes } from "../../../common/utils";
import { codes, DIGIT_CHARS } from "../../common/codes";
import { maxGeneration, XRefEntryType, xRefEntryTypes } from "../../common/const";

export class XRefEntry {

  constructor(readonly type: XRefEntryType,
    readonly objectId: number,
    readonly generation: number,
    readonly byteOffset: number,
    readonly nextFreeId?: number,
    readonly streamId?: number,
    readonly streamIndex?: number) { }   
    
  static *parseFromTable(bytes: Uint8Array): Iterable<XRefEntry> {
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

      while (!DIGIT_CHARS.has(bytes[i])) {
        i++;
      }
      
      for (j = 0; j < count; j++) {
        const value = parseInt(Array.from(bytes.subarray(i, i + 10))
          .map(x => String.fromCharCode(x)).join(""), 10);
        i += 11;
        const gen = parseInt(Array.from(bytes.subarray(i, i + 5))
          .map(x => String.fromCharCode(x)).join(""), 10);
        i += 6;        
        const typeByte = bytes[i];
        if (typeByte === codes.f) {
          yield new XRefEntry(xRefEntryTypes.FREE, firstIndex++, gen, null, value);
        } else if (typeByte === codes.n) {
          yield new XRefEntry(xRefEntryTypes.NORMAL, firstIndex++, gen, value);
        }
        i += 3;
      }
    }

    return;
  } 

  static *parseFromStream(bytes: Uint8Array, w: [number, number, number],
    index?: number[]): Iterable<XRefEntry> {
    const [w1, w2, w3] = w;
    const entryLength = w1 + w2 + w3;

    if (bytes.length % entryLength) {
      throw new Error("Incorrect stream length");
    }

    const count = bytes.length / entryLength;
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
          yield new XRefEntry(xRefEntryTypes.FREE, ids[j++], value2 ?? maxGeneration, null, value1);
          break;
        case xRefEntryTypes.NORMAL:
          yield new XRefEntry(xRefEntryTypes.NORMAL, ids[j++], value2 ?? 0, value1);
          break;
        case xRefEntryTypes.COMPRESSED:
          yield new XRefEntry(xRefEntryTypes.COMPRESSED, ids[j++], 0, null, null, value1, value2);
          break;
        default:
          // treat other types as an absence of entry
          break;
      }
    }

    return;
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
