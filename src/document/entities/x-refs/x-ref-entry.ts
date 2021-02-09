import { int16ToBytes, int32ToBytes, int8ToBytes, parseIntFromBytes } from "../../../common/utils";
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
    
  static *fromTableBytes(bytes: Uint8Array): Iterable<XRefEntry> {
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

  static *fromStreamBytes(bytes: Uint8Array, w: [number, number, number],
    index?: number[]): Iterable<XRefEntry> {
    const [w1, w2, w3] = w;
    const entryLength = w1 + w2 + w3;

    if (bytes.length % entryLength) {
      throw new Error("Incorrect stream length");
    }

    const count = bytes.length / entryLength;
    const ids: number[] = new Array(count);    
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
    } else {      
      let l = 0;
      while(l < count) {
        ids[l++] = l;
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

  static toTableBytes(entries: XRefEntry[]): Uint8Array {
    if (!entries?.length) {
      return null;
    }
    const encoder = new TextEncoder();
    const groups = this.groupEntries(entries);

    let bytes = new Uint8Array();
    let temp: Uint8Array;
    let line: string;
    for (const group of groups) {
      line = `${group[0]} ${group[1].length}\r\n`;

      temp = new Uint8Array(bytes.length + line.length);
      temp.set(bytes);
      temp.set(encoder.encode(line), bytes.length);
      bytes = temp;

      for (const entry of group[1]) {
        switch (entry.type) {
          case xRefEntryTypes.FREE:
            line = `${entry.nextFreeId.toString().padStart(10, "0")} ${entry.generation.toString().padStart(5, "0")} f\r\n`;
            break;
          case xRefEntryTypes.NORMAL:
            line = `${entry.byteOffset.toString().padStart(10, "0")} ${entry.generation.toString().padStart(5, "0")} n\r\n`;
            break;
          default:
            continue;
        }

        temp = new Uint8Array(bytes.length + line.length);
        temp.set(bytes);
        temp.set(encoder.encode(line), bytes.length);
        bytes = temp;
      }
    }

    // TODO: Implement
    return bytes;
  }

  static toStreamBytes(entries: XRefEntry[],
    w: [w1: 0 | 1 | 2, w2: 1 | 2 | 4, w3: 0 | 1 | 2] = [1, 4, 2]): {bytes: Uint8Array; index: Uint8Array} {
    if (!entries?.length) {
      return null;
    }
    let [w1, w2, w3] = w;
    w1 ??= 0;
    w2 ??= 4;
    w3 ??= 0;
    const entryLength = w1 + w2 + w3;
    let w1ToBytesFunc: (n: number) => Uint8Array;
    let w2ToBytesFunc: (n: number) => Uint8Array;
    let w3ToBytesFunc: (n: number) => Uint8Array;
    switch (w1) {
      case 0:
        w1ToBytesFunc = (n: number) => new Uint8Array();
        break;
      case 1:
        w1ToBytesFunc = int8ToBytes;
        break;
      case 2:
        w1ToBytesFunc = int16ToBytes;
        break;
    }
    switch (w2) {
      case 1:
        w2ToBytesFunc = int8ToBytes;
        break;
      case 2:
        w2ToBytesFunc = int16ToBytes;
        break;
      case 4:
        w2ToBytesFunc = int32ToBytes;
        break;
    }
    switch (w3) {
      case 0:
        w3ToBytesFunc = (n: number) => new Uint8Array();
        break;
      case 1:
        w3ToBytesFunc = int8ToBytes;
        break;
      case 2:
        w3ToBytesFunc = int16ToBytes;
        break;
    }

    const encoder = new TextEncoder();
    const groups = this.groupEntries(entries);
    
    let index = new Uint8Array([codes.L_BRACKET]);
    let bytes = new Uint8Array();
    let temp: Uint8Array;
    let groupIndex: string;
    let entryV1: Uint8Array;
    let entryV2: Uint8Array;
    let entryV3: Uint8Array;
    for (const group of groups) {
      groupIndex = ` ${group[0]} ${group[1].length}`;

      temp = new Uint8Array(index.length + groupIndex.length);
      temp.set(index);
      temp.set(encoder.encode(groupIndex), index.length);
      index = temp;

      for (const entry of group[1]) {
        switch (entry.type) {
          case xRefEntryTypes.FREE:
            entryV1 = w1ToBytesFunc(0); 
            entryV2 = w2ToBytesFunc(entry.nextFreeId);
            entryV3 = w3ToBytesFunc(entry.generation);
            break;
          case xRefEntryTypes.NORMAL:
            entryV1 = w1ToBytesFunc(1); 
            entryV2 = w2ToBytesFunc(entry.byteOffset);
            entryV3 = w3ToBytesFunc(entry.generation);
            break;
          case xRefEntryTypes.COMPRESSED:
            entryV1 = w1ToBytesFunc(2); 
            entryV2 = w2ToBytesFunc(entry.streamId);
            entryV3 = w3ToBytesFunc(entry.streamIndex);
            break;
          default:
            continue;
        }
        temp = new Uint8Array(bytes.length + entryLength);
        temp.set(bytes);
        temp.set(entryV1, bytes.length);
        temp.set(entryV2, bytes.length + w1);
        temp.set(entryV3, bytes.length + w1 + w2);
        bytes = temp;
      }
    }

    temp = new Uint8Array(index.length + 1);
    temp.set(index);
    temp.set([codes.R_BRACKET], index.length);
    index = temp;
    return {bytes, index};
  }

  private static groupEntries(entries: XRefEntry[]): [startId: number, entries: XRefEntry[]][] {
    entries.sort((a, b) => a.objectId - b.objectId);
    const groups: [startId: number, entries: XRefEntry[]][] = [];
    let groupStart: number;
    let groupEntries: XRefEntry[];
    let last: number;
    for (const entry of entries) {
      if (entry.objectId !== last + 1) {
        // group ended. push previous group if present
        if (groupEntries?.length) {
          groups.push([groupStart, groupEntries]);
        }
        groupStart = entry.objectId;
        groupEntries = [entry];
      } else {
        groupEntries.push(entry);
      }
      last = entry.objectId;
    }
    // push last group if present
    if (groupEntries?.length) {
      groups.push([groupStart, groupEntries]);
    }
    return groups;
  }
}
