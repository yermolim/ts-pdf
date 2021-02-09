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

export function int16ToBytes(int: number): Uint8Array {
  const buffer = new ArrayBuffer(2);
  const view = new DataView(buffer);
  view.setInt16(0, int, false);
  return new Uint8Array(buffer);
}

export function int32ToBytes(int: number): Uint8Array {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setInt32(0, int, false);
  return new Uint8Array(buffer);
}

export interface Position {
  x: number;
  y: number;
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
  get head(): LinkedListNode<T> {
    return this._head;
  }

  private _length = 0;
  get length(): number {
    return this._length;
  }

  constructor(head?: T) {
    if (head) {
      this.append(head);
    }
  }

  append(value: T) {
    const node = new LinkedListNode<T>(value);
    
    let current: LinkedListNode<T>;
    if (!this._head) {
      this._head = node;
    } else {
      current = this.head;
      while (current.next) {
        current = current.next;
      }
      current.next = node;
    }
    this._length++;
  }

  insert(value: T, n: number): boolean {
    if (n < 0 || n > this._length - 1) {
      return false;
    }

    const node = new LinkedListNode<T>(value);
    let previous: LinkedListNode<T>;
    let current = this.head;
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
    return true;
  }
  
  replace(value: T, n: number): boolean {    
    if (n < 0 || n > this._length - 1) {
      return false;
    }

    const node = new LinkedListNode<T>(value);
    let previous: LinkedListNode<T>;
    let current = this.head;
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
    return true;
  }

  remove(n: number): boolean {    
    if (n < 0 || n > this._length - 1) {
      return false;
    }

    let previous: LinkedListNode<T>;
    let current = this.head;
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
    return true;
  }
  
  get(n: number): T {    
    if (n < 0 || n > this._length - 1) {
      return null;
    }

    let current = this.head;
    let i = 0;
    while (i++ < n) {
      current = current.next;
    }
    return current.data;
  }

  has(value: T, comparator?: (a: T, b: T) => boolean): boolean {
    if (!this._length) {
      return false;
    }

    comparator ||= (a: T, b: T) => a === b;
    
    let current = this.head;
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
    
    let current = this.head;
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
 
  *[Symbol.iterator](): Iterable<T> {
    let current = this._head;
    while (current) {
      yield current.data;
      current = current.next;
    }
  }

}
