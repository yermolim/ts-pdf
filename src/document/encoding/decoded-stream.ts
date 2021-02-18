/* eslint-disable no-bitwise */
import { IStream } from "../common-interfaces";
import { Stream } from "./stream";

export abstract class DecodedStream implements IStream {  
  protected _sourceStream: Stream;

  protected _buffer: Uint8Array;
  protected _minBufferLength = 512;
  protected _bufferLength = 0;
  protected _current = 0;
  protected _ended = false;

  protected constructor (encodedStream: Stream) {    
    this._sourceStream = encodedStream;
  }
  
  /**
   * returns the current buffer length, NOT the total decoded length!
   */
  get length(): number {
    return this._buffer.length;
  }

  ensureBuffer(size: number) {
    const buffer = this._buffer;
    if (buffer && size <= buffer.byteLength) {
      return buffer;
    }

    let length = this._minBufferLength;
    while (length < size) {
      length *= 2;
    }

    const enlargedBuffer = new Uint8Array(length);
    if (buffer) {
      enlargedBuffer.set(buffer);
    }
    return (this._buffer = enlargedBuffer);
  }

  takeByte(): number {
    const current = this._current;
    while (this._bufferLength <= current) {
      if (this._ended) {
        return -1;
      }
      this._readBlock();
    }
    return this._buffer[this._current++];
  }

  /**
   * returns subarray for speed's sake so should be used as read-only
   * @param length
   */
  takeBytes(length?: number): Uint8Array {
    let end: number;
    const position = this._current;

    if (length) {
      this.ensureBuffer(position + length);
      end = position + length;
      while (!this._ended && this._bufferLength < end) {
        this._readBlock();
      }
      if (end > this._bufferLength) {
        end = this._bufferLength;
      }
    } else {
      while (!this._ended) {
        this._readBlock();
      }
      end = this._bufferLength;
    }

    this._current = end;

    const subarray = this._buffer.subarray(position, end);
    return subarray;
  }

  takeUint16(): number {
    const byte_0 = this.takeByte();
    const byte_1 = this.takeByte();
    if (byte_0 === -1 || byte_1 === -1) {
      return -1;
    }
    return (byte_0 << 8) + byte_1;
  }

  takeInt32(): number {
    const byte_0 = this.takeByte();
    const byte_1 = this.takeByte();
    const byte_2 = this.takeByte();
    const byte_3 = this.takeByte();
    return (byte_0 << 24) + (byte_1 << 16) + (byte_2 << 8) + byte_3;
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

  skip(n?: number) {
    this._current += n || 1;
  }

  reset() {
    this._current = 0;
  }  

  protected abstract _readBlock(): void;
}
