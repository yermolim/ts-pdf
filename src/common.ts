import { v4 as uuidV4 } from "uuid";
import { mat3From4Vec2, Vec2 } from "./math";

/* eslint-disable no-bitwise */
export function getRandomUuid(): string {
  // return crypto.getRandomValues(new Uint32Array(4)).join("-");
  return uuidV4();
}

export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function buildCloudCurveFromPolyline(polylinePoints: Vec2[], maxArcSize: number): CloudCurveData {
  if (!polylinePoints || polylinePoints.length < 2) {
    // not a polyline
    return null;
  }
  if (isNaN(maxArcSize) || maxArcSize <= 0) {
    throw new Error(`Invalid maximal arc size ${maxArcSize}`);
  }
  
  const start = polylinePoints[0].clone();
  const curves: CurveData[] = [];

  const zeroVec = new Vec2();
  const lengthVec = new Vec2();
  let i: number;
  let j: number;
  let lineStart: Vec2;
  let lineEnd: Vec2;
  let lineLength: number;
  let arcCount: number;
  let arcSize: number;  
  let halfArcSize: number;
  let arcStart: number;
  let arcEnd: number;
  for (i = 0; i < polylinePoints.length - 1; i++) {
    lineStart = polylinePoints[i];
    lineEnd = polylinePoints[i + 1];
    lineLength = Vec2.substract(lineEnd, lineStart).getMagnitude();
    if (!lineLength) {
      // skip lines with zero length
      continue;
    }

    lengthVec.set(lineLength, 0);
    // get the matrix to transform the 'cloudy' line to the same position the source line has
    const matrix = mat3From4Vec2(zeroVec, lengthVec, lineStart, lineEnd);    

    arcCount = Math.ceil(lineLength / maxArcSize);
    arcSize = lineLength / arcCount;
    halfArcSize = arcSize / 2;
    for (j = 0; j < arcCount; j++) {
      arcStart = j * arcSize;
      arcEnd = (j + 1) * arcSize;
      const curve: CurveData = [
        new Vec2(arcStart, halfArcSize).applyMat3(matrix), // curve control 1
        new Vec2(arcEnd, halfArcSize).applyMat3(matrix), // curve control 2
        new Vec2(arcEnd, 0).applyMat3(matrix), // curve end
      ];
      curves.push(curve);
    }
  }

  return {
    start,
    curves,
  };
}

type CurveData = [control1: Vec2, control2: Vec2, end: Vec2];

export interface CloudCurveData {
  start: Vec2;
  curves: CurveData[];
}

export interface PointerDownInfo {
  timestamp: number;
  clientX: number;
  clientY: number;
}

export interface RenderToSvgResult {
  svg: SVGGraphicsElement;
  clipPaths?: SVGClipPathElement[];
  
  tempCopy?: SVGGraphicsElement;
  tempCopyUse?: SVGUseElement;
}

export interface BBox {
  ll: Vec2; 
  lr: Vec2; 
  ur: Vec2; 
  ul: Vec2;
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

/**
 * readonly tuple of two numbers
 */
export type Double = readonly [x: number, y: number];

/**
* readonly tuple of four numbers
*/
export type Quadruple = readonly [x1: number, y1: number, x2: number, y2: number];

/**
* readonly tuple of six numbers
*/
export type Hextuple = readonly [a: number, b: number, d: number, e: number, g: number, h: number];

/**
* readonly tuple of eight numbers
*/
export type Octuple = readonly [x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number];
