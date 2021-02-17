/* eslint-disable no-bitwise */
export function getRandomUuid(): string {
  return crypto.getRandomValues(new Uint32Array(4)).join("-");
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(v, max));
}

export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function getCenter(x1: number, y1: number, x2: number, y2: number): Position {
  return {
    x: (x2 + x1) / 2,
    y: (y2 + y1) / 2,
  };
}

export function parseIntFromBytes(bytes: Uint8Array): number {
  if (!bytes?.length) {
    return 0;
  }
  if (bytes.length === 1) {
    return bytes[0];
  }
  const hex = Array.from(bytes, (byte) => 
    // eslint-disable-next-line no-bitwise
    ("0" + (byte & 0xFF).toString(16)).slice(-2)).join("");
  return parseInt(hex, 16);
}

export function int8ToBytes(int: number): Uint8Array {
  const buffer = new ArrayBuffer(1);
  const view = new DataView(buffer);
  view.setInt8(0, int);
  return new Uint8Array(buffer);
}

export function int16ToBytes(int: number, le = false): Uint8Array {
  const buffer = new ArrayBuffer(2);
  const view = new DataView(buffer);
  view.setInt16(0, int, le);
  return new Uint8Array(buffer);
}

export function int32ToBytes(int: number, le = false): Uint8Array {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setInt32(0, int, le);
  return new Uint8Array(buffer);
}

export function int32ArrayToBytes(intArr: number[], le = false): Uint8Array {
  const buffer = new ArrayBuffer(intArr.length * 4);
  const view = new DataView(buffer);
  for (let i = 0; i < intArr.length; i++) {
    view.setInt32(i * 4, intArr[i], le);
  }
  return new Uint8Array(buffer);
}

export function bytesToInt32Array(bytes: Uint8Array, le = false): Int32Array {
  if (!bytes?.length) {
    return null;
  }  

  const buffer = new ArrayBuffer(Math.ceil(bytes.length / 4) * 4);
  const view = new DataView(buffer);
  for (let i = 0; i < bytes.length; i++) {
    view.setUint8(i, bytes[i]);
  }

  const result = new Int32Array(buffer.byteLength / 4);
  for (let j = 0; j < result.length; j++) {
    result[j] = view.getInt32(j * 4, le);
  }
  return result;
}

export function xorBytes(bytes: Uint8Array, n: number): Uint8Array {
  const result = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++){
    // eslint-disable-next-line no-bitwise
    result[i] = bytes[i] ^ n;
  }
  return result;
}

export function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {  
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

export function findSubarrayIndex(arr: Uint8Array, sub: Uint8Array): number { 
  if (arr?.length && sub?.length) {
    let j: number; 
    outer_loop:
    for (let i = 0; i <= arr.length; i++) {
      let overlap = false;
      for (j = 0; j < sub.length; j++) {
        if (i + j < arr.length) {
          if (arr[i + j] !== sub[j]) {
            continue outer_loop;
          }
          overlap = true;
        } else if (overlap) {
          return i;
        } else {
          break outer_loop;
        }
      }          
    }
  }
  return -1;
}

export interface Position {
  x: number;
  y: number;
}

export interface Reference {  
  id: number;
  generation: number;
}

export interface Encodable {  
  toArray(): Uint8Array;
}

export class LinkedListNode<T> {
  data: T;
  next: LinkedListNode<T>;

  constructor (data: T) {
    this.data = data;
  }
}

export class LinkedList<T> {
  private _head: LinkedListNode<T>;
  get head(): T {
    return this._head.data;
  }

  private _length = 0;
  get length(): number {
    return this._length;
  }

  get tail(): T {
    return this.get(this._length - 1);
  }

  constructor(head?: T) {
    if (head) {
      this.push(head);
    }
  }

  push(value: T) {
    const node = new LinkedListNode<T>(value);
    
    let current: LinkedListNode<T>;
    if (!this._head) {
      this._head = node;
    } else {
      current = this._head;
      while (current.next) {
        current = current.next;
      }
      current.next = node;
    }
    this._length++;
  }

  /**
   * inserts a node at the specified index and returns the inserted node value 
   * @param value 
   * @param n 
   */
  insert(value: T, n: number): T {
    if (n < 0 || n > this._length - 1) {
      return null;
    }

    const node = new LinkedListNode<T>(value);
    let previous: LinkedListNode<T>;
    let current = this._head;
    let i = 0;

    if (!n) {
      this._head = node;
    } else {
      while (i++ < n) {
        previous = current;
        current = current.next;
      }
      previous.next = node;
    }
    node.next = current;
    this._length++;
    return node.data;
  }
  
  /**
   * removes a node at the specified index and returns the replaced node value 
   * @param value 
   * @param n 
   */
  replace(value: T, n: number): T {    
    if (n < 0 || n > this._length - 1) {
      return null;
    }

    const node = new LinkedListNode<T>(value);
    let previous: LinkedListNode<T>;
    let current = this._head;
    let i = 0;

    if (!n) {
      this._head = node;
    } else {
      while (i++ < n) {
        previous = current;
        current = current.next;
      }
      previous.next = node;
    }
    node.next = current.next;
    return current.data;
  }

  /**
   * removes a node at the specified index and returns the removed node value 
   * @param n 
   */
  remove(n: number): T {    
    if (n < 0 || n > this._length - 1) {
      return null;
    }

    let previous: LinkedListNode<T>;
    let current = this._head;
    let i = 0;

    if (!n) {
      this._head = current.next;
    } else {
      while (i++ < n) {
        previous = current;
        current = current.next;
      }
      previous.next = current.next;
    }
    this._length--;
    return current.data;
  }
  
  clear() {
    this._head = null;
    this._length = 0;
  }

  get(n: number): T {    
    if (n < 0 || n > this._length - 1) {
      return null;
    }

    let current = this._head;
    let i = 0;
    while (i++ < n) {
      current = current.next;
    }
    return current.data;
  }  

  pop(): T {
    return this.remove(this._length - 1);
  }

  has(value: T, comparator?: (a: T, b: T) => boolean): boolean {
    if (!this._length) {
      return false;
    }

    comparator ||= (a: T, b: T) => a === b;
    
    let current = this._head;
    let i = 0;
    while (i < this._length) {
      if (comparator(value, current.data)) {
        return true;
      }
      current = current.next;
      i++;
    }
    return false;
  }
  
  findIndex(value: T, comparator?: (a: T, b: T) => boolean): number {
    if (!this._length) {
      return -1;
    }
    
    comparator ||= (a: T, b: T) => a === b;
    
    let current = this._head;
    let i = 0;
    while (i < this._length) {
      if (comparator(value, current.data)) {
        return i;
      }
      current = current.next;
      i++;
    }
    return -1;
  }
 
  *[Symbol.iterator]() {
    let current = this._head;
    while (current) {
      yield current.data;
      current = current.next;
    }
  }

}
