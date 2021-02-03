/* eslint-disable no-bitwise */
import { IStream } from "./i-stream";

export class Stream implements IStream {
  protected _bytes: Uint8Array;

  protected _start: number;
  protected _end: number;
  protected _current: number;

  constructor(bytes: number[] | Uint8Array, start = 0, length?: number) {
    if (length && length < 0) {
      throw new Error("Stream length can't be negative");
    }

    this._bytes = bytes instanceof Uint8Array
      ? bytes
      : new Uint8Array(bytes);
    this._start = start;
    this._current = start;
    this._end = start + length || bytes.length;
  }

  get length(): number {
    return this._end - this._start;
  }

  takeByte(): number {
    if (this._current >= this._end) {
      return -1;
    }
    return this._bytes[this._current++];
  }

  /**
   * returns subarray for speed's sake so should be used as read-only
   * @param length
   */
  takeBytes(length?: number): Uint8Array {
    const bytes = this._bytes;
    const position = this._current;
    const bytesEnd = this._end;

    if (!length) {
      const subarray = bytes.subarray(position, bytesEnd);
      return subarray;
    } else {
      let end = position + length;
      if (end > bytesEnd) {
        end = bytesEnd;
      }
      this._current = end;
      const subarray = bytes.subarray(position, end);
      return subarray;
    }
  }

  takeUint16(): number {
    const b0 = this.takeByte();
    const b1 = this.takeByte();
    if (b0 === -1 || b1 === -1) {
      return -1;
    }
    return (b0 << 8) + b1;
  }

  takeInt32(): number {
    const b0 = this.takeByte();
    const b1 = this.takeByte();
    const b2 = this.takeByte();
    const b3 = this.takeByte();
    return (b0 << 24) + (b1 << 16) + (b2 << 8) + b3;
  }
  
  peekByte(): number {
    const peekedByte = this.takeByte();
    if (peekedByte !== -1) {
      this._current--;
    }
    return peekedByte;
  }

  /**
   * returns subarray for speed's sake so should be used as read-only
   * @param length
   */
  peekBytes(length?: number): Uint8Array {
    const bytes = this.takeBytes(length);
    this._current -= bytes.length;
    return bytes;
  }
  
  /**
   * returns subarray for speed's sake so should be used as read-only
   * @param start
   * @param end
   */
  getByteRange(start: number, end: number): Uint8Array {
    return this._bytes.subarray(Math.max(start, 0), Math.min(end, this._end));
  }

  skip(n?: number) {
    this._current += n || 1;
  }

  reset() {
    this._current = this._start;
  }
}
