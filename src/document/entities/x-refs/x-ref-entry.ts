import { parseIntFromBytes, int8ToBytes, 
  int16ToBytes, int32ToBytes } from "../../../common/byte";
import { codes, isDigit } from "../../char-codes";
import { maxGeneration, XRefEntryType, xRefEntryTypes } from "../../spec-constants";
import { Reference } from "../../common-interfaces";

/**PDF cross-reference section entry */
export class XRefEntry implements Reference {
  /**
   * 
   * @param type 
   * @param id 
   * @param generation 
   * @param byteOffset object byte offset from the document start (parent stream offset for objects stored inside object streams)
   * @param streamId parent stream id (for objects stored inside object streams)
   * @param streamIndex object index inside parent stream (for objects stored inside object streams)
   */
  constructor(readonly type: XRefEntryType,
    readonly id: number,
    readonly generation: number,
    readonly byteOffset: number,
    readonly nextFreeId?: number,
    readonly streamId?: number,
    readonly streamIndex?: number) { }   
    
  /**
   * parse cross-reference entries from cross-reference table bytes
   * @param bytes cross-reference table bytes
   * @returns entries iterable object
   */
  static *fromTableBytes(bytes: Uint8Array): Iterable<XRefEntry> {
    let i = 0;
    let j = 0;   
    
    while (i < bytes.length) {
      const firstIndexBytes: number[] = [];
      let firstIndexDigit = bytes[i++];
      while (isDigit(firstIndexDigit)) {
        firstIndexBytes.push(firstIndexDigit);
        firstIndexDigit = bytes[i++];
      }
      let firstIndex = parseInt(firstIndexBytes.map(x => String.fromCharCode(x)).join(""), 10);
      
      const countBytes: number[] = [];
      let countDigit = bytes[i++];
      while (isDigit(countDigit)) {
        countBytes.push(countDigit);
        countDigit = bytes[i++];
      }
      const count = parseInt(countBytes.map(x => String.fromCharCode(x)).join(""), 10); 

      while (!isDigit(bytes[i])) {
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

  /**
   * parse cross-reference entries from cross-reference stream bytes
   * @param bytes stream byte array
   * @param w an array of integers representing the size of the fields in a single cross-reference entry
   * @param index an array containing a pair of integers for each subsection in this section 
   * ([the first object number in the subsection, the number of entries in the subsection...])
   * @returns 
   */
  static *fromStreamBytes(bytes: Uint8Array, w: [number, number, number],
    index?: number[]): Iterable<XRefEntry> {
    const [w1, w2, w3] = w;
    const entryLength = w1 + w2 + w3;

    // DEBUG
    // console.log(`W: ${w1} ${w2} ${w3} (${entryLength}), L: ${bytes.length}`);

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

  /**serialize entries to cross-reference table byte array */
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

    return bytes;
  }

  /**
   * serialize entries to cross-reference stream byte array
   * @param entries 
   * @param w an array of integers representing the size of the fields in a single cross-reference entry
   * @returns 
   */
  static toStreamBytes(entries: XRefEntry[],
    w: [w1: number, w2: number, w3: number] = [1, 4, 2]): {bytes: Uint8Array; index: number[]} {
    if (!entries?.length) {
      return null;
    }

    if (Math.min(...w) < 0) {
      throw new Error("Negative length values are not permitted");
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
        w1ToBytesFunc = () => new Uint8Array();
        break;
      case 1:
        w1ToBytesFunc = int8ToBytes;
        break;
      case 2:
        w1ToBytesFunc = int16ToBytes;
        break;
      default:
        // just pad 3-bytes value with 0s
        w2ToBytesFunc = (n: number) => new Uint8Array([...new Array(w1 - 2).fill(0), ...int16ToBytes(n)]);
        break;
    }
    switch (w2) {
      case 1:
        w2ToBytesFunc = int8ToBytes;
        break;
      case 2:
        w2ToBytesFunc = int16ToBytes;
        break;
      case 3:
        // just pad 2-bytes value with 0
        w2ToBytesFunc = (n: number) => new Uint8Array([0, ...int16ToBytes(n)]);
        break;
      case 4:
        w2ToBytesFunc = int32ToBytes;
        break;
      default:
        // just pad 4-bytes value with 0s
        w2ToBytesFunc = (n: number) => new Uint8Array([...new Array(w1 - 4).fill(0), ...int32ToBytes(n)]);
        break;
    }
    switch (w3) {
      case 0:
        w3ToBytesFunc = () => new Uint8Array();
        break;
      case 1:
        w3ToBytesFunc = int8ToBytes;
        break;
      case 2:
        w3ToBytesFunc = int16ToBytes;
        break;
      default:
        // just pad 2-bytes value with 0s
        w2ToBytesFunc = (n: number) => new Uint8Array([...new Array(w1 - 2).fill(0), ...int16ToBytes(n)]);
        break;
    }

    const encoder = new TextEncoder();
    const groups = this.groupEntries(entries);
    
    const index: number[] = [];
    let bytes = new Uint8Array();
    let temp: Uint8Array;
    let entryV1: Uint8Array;
    let entryV2: Uint8Array;
    let entryV3: Uint8Array;
    for (const group of groups) {
      index.push(group[0], group[1].length);

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

    // DEBUG
    // console.log(`W: ${w1} ${w2} ${w3} (${w1 + w2 + w3}), L: ${bytes.length}`);

    return {bytes, index};
  }

  /**
   * group entries to sequential subsections
   * @param entries 
   * @returns 
   */
  private static groupEntries(entries: XRefEntry[]): [startId: number, entries: XRefEntry[]][] {
    entries.sort((a, b) => a.id - b.id);
    const groups: [startId: number, entries: XRefEntry[]][] = [];
    let groupStart: number;
    let groupEntries: XRefEntry[];
    let last: number;
    for (const entry of entries) {
      if (entry.id !== last + 1) {
        // group ended. push previous group if present
        if (groupEntries?.length) {
          groups.push([groupStart, groupEntries]);
        }
        groupStart = entry.id;
        groupEntries = [entry];
      } else {
        groupEntries.push(entry);
      }
      last = entry.id;
    }
    // push last group if present
    if (groupEntries?.length) {
      groups.push([groupStart, groupEntries]);
    }
    return groups;
  }
}
