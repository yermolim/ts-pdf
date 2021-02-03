/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-bitwise */
// import { inflate } from "pako";
import { decompressSync } from "fflate";
import { FlatePredictor, flatePredictors } from "./const";

export class FlateDecoder {

  static Decode(input: Uint8Array, 
    predictor: FlatePredictor = flatePredictors.NONE, 
    columns = 1, components = 1, bpc = 8): Uint8Array {

    const stream = new Stream(input, 0, input.length);
    const fs = new FlateStream(stream);
    const inflated = <Uint8Array>fs.takeBytes(null);
    console.log(inflated);

    // const inflated = decompressSync(input); // fails sometimes, yet don't know why

    switch (predictor) {
      case (flatePredictors.NONE):
        return inflated;
      case (flatePredictors.PNG_NONE):
      case (flatePredictors.PNG_SUB):
      case (flatePredictors.PNG_UP):
      case (flatePredictors.PNG_AVERAGE):
      case (flatePredictors.PNG_PAETH):
      case (flatePredictors.PNG_OPTIMUM):
        return FlateDecoder.removePngFilter(inflated, columns, components, bpc);
      case (flatePredictors.TIFF):
        throw new Error("Unsupported filter predictor");
    }
  }

  static Encode(input: Uint8Array): Uint8Array {
    // TODO: implement
    return null;
  }

  private static removePngFilter(input: Uint8Array, 
    columns: number, components: number, bpc: number): Uint8Array {
      
    const interval = Math.ceil(components * bpc / 8);
    const lineLen = columns * interval;    
    const lineLen_filtered = lineLen + 1;

    if (!!(input.length % lineLen_filtered)) {
      throw new Error("Data length doesn't match filter columns");
    }

    const output = new Uint8Array(input.length / lineLen_filtered * lineLen);
    const previous: number[] = new Array(lineLen).fill(0);
    const current: number[] = new Array(lineLen).fill(0);
    
    const getLeft = (j: number) => 
      j - interval < 0 // the pixel is the first one in the line, so 'left' is 0
        ? 0 
        : current[j - interval];

    const getAbove = (j: number) => 
      previous[j];

    const getUpperLeft = (j: number) => 
      j - interval < 0 // the pixel is the first one in the line, so 'upperLeft' is 0
        ? 0 
        : previous[j - interval];
    
    let x = 0;
    let y = 0;
    let k = 0;
    let rowStart = 0;
    let filterType = 0;
    let result = 0;
    for (let i = 0; i < input.length; i++) {
      if (i % lineLen_filtered === 0) {
        filterType = input[i];
        x = 0;
        if (i) {
          for (k = 0; k < lineLen; k++) {
            previous[k] = output[rowStart + k];
          }
        }
        rowStart = y;
      } else {
        current[x] = input[i];
        switch (filterType) {
          case 0: // PNG_NONE 
            // With the None filter, the scanline is transmitted unmodified
            result = current[x];
            break;
          case 1: // PNG_SUB 
            // The Sub filter transmits the difference between each byte 
            // and the value of the corresponding byte of the prior pixel
            result = (current[x] + getLeft(x)) % 256;
            break;
          case 2: // PNG_UP 
            // The Up filter is just like the Sub filter except that the pixel 
            // immediately above the current pixel, rather than just to its left, is used as the predictor
            result = (current[x] + getAbove(x)) % 256;
            break;
          case 3: // PNG_AVERAGE
            // The Average filter uses the average of the two neighboring pixels (left and above) 
            // to predict the value of a pixel
            result = (current[x] + Math.floor((getAbove(x) + getLeft(x)) / 2)) % 256;
            break;
          case 4: // PNG_PAETH 
            // The Paeth filter computes a simple linear function of the three neighboring pixels 
            // (left, above, upper left), then chooses as predictor the neighboring pixel 
            // closest to the computed value
            result = (current[x] + this.paethPredictor(getLeft(x), getAbove(x), getUpperLeft(x))) % 256;
            break;
        }
        output[y++] = result;
        x++;
      }
    }

    return output;
  }

  private static applyPngFilter(input: Uint8Array, 
    predictor: 10 | 11 | 12 | 13 | 14,
    columns: number): Uint8Array {

    // TODO: Implement
      
    switch (predictor) {
      case flatePredictors.PNG_NONE:
        // With the None filter, the scanline is transmitted unmodified
        break;
      case flatePredictors.PNG_SUB:
        // The Sub filter transmits the difference between each byte 
        // and the value of the corresponding byte of the prior pixel
        break;
      case flatePredictors.PNG_UP:
        // The Up filter is just like the Sub filter except that the pixel 
        // immediately above the current pixel, rather than just to its left, is used as the predictor
        break;
      case flatePredictors.PNG_AVERAGE:
        // The Average filter uses the average of the two neighboring pixels (left and above) 
        // to predict the value of a pixel
        break;
      case flatePredictors.PNG_PAETH:
        // The Paeth filter computes a simple linear function of the three neighboring pixels 
        // (left, above, upper left), then chooses as predictor the neighboring pixel 
        // closest to the computed value
        break;
    }

    return null;
  }

  /**
   * The Paeth filter computes a simple linear function 
   * of the three neighboring pixels (left, above, upper left), 
   * then chooses as predictor the neighboring pixel closest to the computed value
   * @param a left pixel
   * @param b above pixel
   * @param c upper left pixel
   */
  private static paethPredictor(a: number, b: number, c: number): number {

    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);

    if (pa <= pb && pa <= pc) {
      return a;
    } else if (pb <= pc) {
      return b;
    } else {
      return c;
    }
  }
}


type HuffmanTable = [codes: Int32Array, maxLength: number];

interface IStream { 
  length: number;

  takeByte(): number;

  takeBytes(length?: number): Uint8Array;

  takeUint16(): number;

  takeInt32(): number;
  
  peekByte(): number;

  peekBytes(length?: number): Uint8Array;
  
  getByteRange?(start: number, end: number): Uint8Array;
}

class Stream implements IStream {
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

abstract class DecodedStream implements IStream {  
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

class FlateStream extends DecodedStream {

  static readonly codeLenCodeMap = new Int32Array([
    16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15
  ]);

  static readonly lengthDecode = new Int32Array([
    0x00003, 0x00004, 0x00005, 0x00006, 0x00007, 0x00008, 0x00009, 0x0000a,
    0x1000b, 0x1000d, 0x1000f, 0x10011, 0x20013, 0x20017, 0x2001b, 0x2001f,
    0x30023, 0x3002b, 0x30033, 0x3003b, 0x40043, 0x40053, 0x40063, 0x40073,
    0x50083, 0x500a3, 0x500c3, 0x500e3, 0x00102, 0x00102, 0x00102
  ]);

  static readonly distDecode = new Int32Array([
    0x00001, 0x00002, 0x00003, 0x00004, 0x10005, 0x10007, 0x20009, 0x2000d,
    0x30011, 0x30019, 0x40021, 0x40031, 0x50041, 0x50061, 0x60081, 0x600c1,
    0x70101, 0x70181, 0x80201, 0x80301, 0x90401, 0x90601, 0xa0801, 0xa0c01,
    0xb1001, 0xb1801, 0xc2001, 0xc3001, 0xd4001, 0xd6001
  ]);

  static readonly fixedLitCodeTab: HuffmanTable = [new Int32Array([
    0x70100, 0x80050, 0x80010, 0x80118, 0x70110, 0x80070, 0x80030, 0x900c0,
    0x70108, 0x80060, 0x80020, 0x900a0, 0x80000, 0x80080, 0x80040, 0x900e0,
    0x70104, 0x80058, 0x80018, 0x90090, 0x70114, 0x80078, 0x80038, 0x900d0,
    0x7010c, 0x80068, 0x80028, 0x900b0, 0x80008, 0x80088, 0x80048, 0x900f0,
    0x70102, 0x80054, 0x80014, 0x8011c, 0x70112, 0x80074, 0x80034, 0x900c8,
    0x7010a, 0x80064, 0x80024, 0x900a8, 0x80004, 0x80084, 0x80044, 0x900e8,
    0x70106, 0x8005c, 0x8001c, 0x90098, 0x70116, 0x8007c, 0x8003c, 0x900d8,
    0x7010e, 0x8006c, 0x8002c, 0x900b8, 0x8000c, 0x8008c, 0x8004c, 0x900f8,
    0x70101, 0x80052, 0x80012, 0x8011a, 0x70111, 0x80072, 0x80032, 0x900c4,
    0x70109, 0x80062, 0x80022, 0x900a4, 0x80002, 0x80082, 0x80042, 0x900e4,
    0x70105, 0x8005a, 0x8001a, 0x90094, 0x70115, 0x8007a, 0x8003a, 0x900d4,
    0x7010d, 0x8006a, 0x8002a, 0x900b4, 0x8000a, 0x8008a, 0x8004a, 0x900f4,
    0x70103, 0x80056, 0x80016, 0x8011e, 0x70113, 0x80076, 0x80036, 0x900cc,
    0x7010b, 0x80066, 0x80026, 0x900ac, 0x80006, 0x80086, 0x80046, 0x900ec,
    0x70107, 0x8005e, 0x8001e, 0x9009c, 0x70117, 0x8007e, 0x8003e, 0x900dc,
    0x7010f, 0x8006e, 0x8002e, 0x900bc, 0x8000e, 0x8008e, 0x8004e, 0x900fc,
    0x70100, 0x80051, 0x80011, 0x80119, 0x70110, 0x80071, 0x80031, 0x900c2,
    0x70108, 0x80061, 0x80021, 0x900a2, 0x80001, 0x80081, 0x80041, 0x900e2,
    0x70104, 0x80059, 0x80019, 0x90092, 0x70114, 0x80079, 0x80039, 0x900d2,
    0x7010c, 0x80069, 0x80029, 0x900b2, 0x80009, 0x80089, 0x80049, 0x900f2,
    0x70102, 0x80055, 0x80015, 0x8011d, 0x70112, 0x80075, 0x80035, 0x900ca,
    0x7010a, 0x80065, 0x80025, 0x900aa, 0x80005, 0x80085, 0x80045, 0x900ea,
    0x70106, 0x8005d, 0x8001d, 0x9009a, 0x70116, 0x8007d, 0x8003d, 0x900da,
    0x7010e, 0x8006d, 0x8002d, 0x900ba, 0x8000d, 0x8008d, 0x8004d, 0x900fa,
    0x70101, 0x80053, 0x80013, 0x8011b, 0x70111, 0x80073, 0x80033, 0x900c6,
    0x70109, 0x80063, 0x80023, 0x900a6, 0x80003, 0x80083, 0x80043, 0x900e6,
    0x70105, 0x8005b, 0x8001b, 0x90096, 0x70115, 0x8007b, 0x8003b, 0x900d6,
    0x7010d, 0x8006b, 0x8002b, 0x900b6, 0x8000b, 0x8008b, 0x8004b, 0x900f6,
    0x70103, 0x80057, 0x80017, 0x8011f, 0x70113, 0x80077, 0x80037, 0x900ce,
    0x7010b, 0x80067, 0x80027, 0x900ae, 0x80007, 0x80087, 0x80047, 0x900ee,
    0x70107, 0x8005f, 0x8001f, 0x9009e, 0x70117, 0x8007f, 0x8003f, 0x900de,
    0x7010f, 0x8006f, 0x8002f, 0x900be, 0x8000f, 0x8008f, 0x8004f, 0x900fe,
    0x70100, 0x80050, 0x80010, 0x80118, 0x70110, 0x80070, 0x80030, 0x900c1,
    0x70108, 0x80060, 0x80020, 0x900a1, 0x80000, 0x80080, 0x80040, 0x900e1,
    0x70104, 0x80058, 0x80018, 0x90091, 0x70114, 0x80078, 0x80038, 0x900d1,
    0x7010c, 0x80068, 0x80028, 0x900b1, 0x80008, 0x80088, 0x80048, 0x900f1,
    0x70102, 0x80054, 0x80014, 0x8011c, 0x70112, 0x80074, 0x80034, 0x900c9,
    0x7010a, 0x80064, 0x80024, 0x900a9, 0x80004, 0x80084, 0x80044, 0x900e9,
    0x70106, 0x8005c, 0x8001c, 0x90099, 0x70116, 0x8007c, 0x8003c, 0x900d9,
    0x7010e, 0x8006c, 0x8002c, 0x900b9, 0x8000c, 0x8008c, 0x8004c, 0x900f9,
    0x70101, 0x80052, 0x80012, 0x8011a, 0x70111, 0x80072, 0x80032, 0x900c5,
    0x70109, 0x80062, 0x80022, 0x900a5, 0x80002, 0x80082, 0x80042, 0x900e5,
    0x70105, 0x8005a, 0x8001a, 0x90095, 0x70115, 0x8007a, 0x8003a, 0x900d5,
    0x7010d, 0x8006a, 0x8002a, 0x900b5, 0x8000a, 0x8008a, 0x8004a, 0x900f5,
    0x70103, 0x80056, 0x80016, 0x8011e, 0x70113, 0x80076, 0x80036, 0x900cd,
    0x7010b, 0x80066, 0x80026, 0x900ad, 0x80006, 0x80086, 0x80046, 0x900ed,
    0x70107, 0x8005e, 0x8001e, 0x9009d, 0x70117, 0x8007e, 0x8003e, 0x900dd,
    0x7010f, 0x8006e, 0x8002e, 0x900bd, 0x8000e, 0x8008e, 0x8004e, 0x900fd,
    0x70100, 0x80051, 0x80011, 0x80119, 0x70110, 0x80071, 0x80031, 0x900c3,
    0x70108, 0x80061, 0x80021, 0x900a3, 0x80001, 0x80081, 0x80041, 0x900e3,
    0x70104, 0x80059, 0x80019, 0x90093, 0x70114, 0x80079, 0x80039, 0x900d3,
    0x7010c, 0x80069, 0x80029, 0x900b3, 0x80009, 0x80089, 0x80049, 0x900f3,
    0x70102, 0x80055, 0x80015, 0x8011d, 0x70112, 0x80075, 0x80035, 0x900cb,
    0x7010a, 0x80065, 0x80025, 0x900ab, 0x80005, 0x80085, 0x80045, 0x900eb,
    0x70106, 0x8005d, 0x8001d, 0x9009b, 0x70116, 0x8007d, 0x8003d, 0x900db,
    0x7010e, 0x8006d, 0x8002d, 0x900bb, 0x8000d, 0x8008d, 0x8004d, 0x900fb,
    0x70101, 0x80053, 0x80013, 0x8011b, 0x70111, 0x80073, 0x80033, 0x900c7,
    0x70109, 0x80063, 0x80023, 0x900a7, 0x80003, 0x80083, 0x80043, 0x900e7,
    0x70105, 0x8005b, 0x8001b, 0x90097, 0x70115, 0x8007b, 0x8003b, 0x900d7,
    0x7010d, 0x8006b, 0x8002b, 0x900b7, 0x8000b, 0x8008b, 0x8004b, 0x900f7,
    0x70103, 0x80057, 0x80017, 0x8011f, 0x70113, 0x80077, 0x80037, 0x900cf,
    0x7010b, 0x80067, 0x80027, 0x900af, 0x80007, 0x80087, 0x80047, 0x900ef,
    0x70107, 0x8005f, 0x8001f, 0x9009f, 0x70117, 0x8007f, 0x8003f, 0x900df,
    0x7010f, 0x8006f, 0x8002f, 0x900bf, 0x8000f, 0x8008f, 0x8004f, 0x900ff
  ]), 9];

  static readonly fixedDistCodeTab: HuffmanTable = [new Int32Array([
    0x50000, 0x50010, 0x50008, 0x50018, 0x50004, 0x50014, 0x5000c, 0x5001c,
    0x50002, 0x50012, 0x5000a, 0x5001a, 0x50006, 0x50016, 0x5000e, 0x00000,
    0x50001, 0x50011, 0x50009, 0x50019, 0x50005, 0x50015, 0x5000d, 0x5001d,
    0x50003, 0x50013, 0x5000b, 0x5001b, 0x50007, 0x50017, 0x5000f, 0x00000
  ]), 5];

  private _codeSize = 0;
  private _codeBuf = 0;

  constructor(encodedStream: Stream) {
    super(encodedStream);

    const cmf = encodedStream.takeByte();
    const flg = encodedStream.takeByte();

    /*
      CINFO (bits 12-15)
      Indicates the window size as a power of two, from 0 (256 bytes) to 7 (32768 bytes). 
      This will usually be 7. Higher values are not allowed.

      CM (bits 8-11)
      The compression method. Only Deflate (8) is allowed.

      FLEVEL (bits 6-7)
      Roughly indicates the compression level, from 0 (fast/low) to 3 (slow/high)

      FDICT (bit 5)
      Indicates whether a preset dictionary is used. This is usually 0.

      FCHECK (bits 0-4)
      A checksum (5 bits, 0..31), whose value is calculated such 
      that the entire value divides 31 with no remainder.
    */

    if (cmf === -1 || flg === -1) {
      throw new Error(`Invalid header in flate stream: ${cmf}, ${flg}`);
    }
    if ((cmf & 0x0f) !== 0x08) {
      throw new Error(`Unknown compression method in flate stream: ${cmf}, ${flg}`);
    }
    if (((cmf << 8) + flg) % 31 !== 0) {
      throw new Error(`Bad FCHECK in flate stream: ${cmf}, ${flg}`);
    }
    if (flg & 0x20) {
      throw new Error(`FDICT bit set in flate stream: ${cmf}, ${flg}`);
    }

    this._codeSize = 0;
    this._codeBuf = 0;
  }

  protected _readBlock() {
    let buffer: Uint8Array;
    let len: number;
    const str = this._sourceStream;
    
    let header = this.getBits(3);
    if (header & 1) {
      this._ended = true;
    }
    header >>= 1;

    if (header === 0) {
      // uncompressed block
      let b: number;

      if ((b = str.takeByte()) === -1) {
        throw new Error("Bad block header in flate stream");
      }
      let blockLen = b;
      if ((b = str.takeByte()) === -1) {
        throw new Error("Bad block header in flate stream");
      }
      blockLen |= b << 8;
      if ((b = str.takeByte()) === -1) {
        throw new Error("Bad block header in flate stream");
      }
      let check = b;
      if ((b = str.takeByte()) === -1) {
        throw new Error("Bad block header in flate stream");
      }
      check |= b << 8;
      if (check !== (~blockLen & 0xffff) && (blockLen !== 0 || check !== 0)) {
        // Ignoring error for bad "empty" block (see issue 1277)
        throw new Error("Bad uncompressed block length in flate stream");
      }

      this._codeBuf = 0;
      this._codeSize = 0;

      const bufferLength = this._bufferLength,
        end = bufferLength + blockLen;
      buffer = this.ensureBuffer(end);
      this._bufferLength = end;

      if (blockLen === 0) {
        if (str.peekByte() === -1) {
          this._ended = true;
        }
      } else {
        const block = str.takeBytes(blockLen);
        buffer.set(block, bufferLength);
        if (block.length < blockLen) {
          this._ended = true;
        }
      }
      return;
    }

    let litCodeTable: HuffmanTable;
    let distCodeTable: HuffmanTable;
    if (header === 1) {
      // compressed block, fixed codes
      litCodeTable = FlateStream.fixedLitCodeTab;
      distCodeTable = FlateStream.fixedDistCodeTab;
    } else if (header === 2) {
      // compressed block, dynamic codes
      const numLitCodes = this.getBits(5) + 257;
      const numDistCodes = this.getBits(5) + 1;
      const numCodeLenCodes = this.getBits(4) + 4;

      // build the code lengths code table
      const codeLenCodeLengths = new Uint8Array(FlateStream.codeLenCodeMap.length);

      let i: number;
      for (i = 0; i < numCodeLenCodes; i++) {
        codeLenCodeLengths[FlateStream.codeLenCodeMap[i]] = this.getBits(3);
      }
      const codeLenCodeTab = this.generateHuffmanTable(codeLenCodeLengths);

      // build the literal and distance code tables
      len = 0;
      i = 0;
      const codes = numLitCodes + numDistCodes;
      const codeLengths = new Uint8Array(codes);
      let bitsLength: number;
      let bitsOffset: number;
      let what: number;
      while (i < codes) {
        const code = this.getCode(codeLenCodeTab);
        if (code === 16) {
          bitsLength = 2;
          bitsOffset = 3;
          what = len;
        } else if (code === 17) {
          bitsLength = 3;
          bitsOffset = 3;
          what = len = 0;
        } else if (code === 18) {
          bitsLength = 7;
          bitsOffset = 11;
          what = len = 0;
        } else {
          codeLengths[i++] = len = code;
          continue;
        }

        let repeatLength = this.getBits(bitsLength) + bitsOffset;
        while (repeatLength-- > 0) {
          codeLengths[i++] = what;
        }
      }

      litCodeTable = this.generateHuffmanTable(
        codeLengths.subarray(0, numLitCodes)
      );
      distCodeTable = this.generateHuffmanTable(
        codeLengths.subarray(numLitCodes, codes)
      );
    } else {
      throw new Error("Unknown block type in flate stream");
    }

    buffer = this._buffer;
    let limit = buffer ? buffer.length : 0;
    let pos = this._bufferLength;
    while (true) {
      let code1 = this.getCode(litCodeTable);
      if (code1 < 256) {
        if (pos + 1 >= limit) {
          buffer = this.ensureBuffer(pos + 1);
          limit = buffer.length;
        }
        buffer[pos++] = code1;
        continue;
      }
      if (code1 === 256) {
        this._bufferLength = pos;
        return;
      }
      code1 -= 257;
      code1 = FlateStream.lengthDecode[code1];
      let code2 = code1 >> 16;
      if (code2 > 0) {
        code2 = this.getBits(code2);
      }
      len = (code1 & 0xffff) + code2;
      code1 = this.getCode(distCodeTable);
      code1 = FlateStream.distDecode[code1];
      code2 = code1 >> 16;
      if (code2 > 0) {
        code2 = this.getBits(code2);
      }
      const dist = (code1 & 0xffff) + code2;
      if (pos + len >= limit) {
        buffer = this.ensureBuffer(pos + len);
        limit = buffer.length;
      }
      for (let k = 0; k < len; ++k, ++pos) {
        buffer[pos] = buffer[pos - dist];
      }
    }
  };  

  private getBits(n: number): number {
    const stream = this._sourceStream;
    let size = this._codeSize;
    let buf = this._codeBuf;

    let value: number;
    while (size < n) {
      if ((value = stream.takeByte()) === -1) {
        throw new Error("Bad encoding in flate stream");
      }
      buf |= value << size;
      size += 8;
    }
    value = buf & ((1 << n) - 1);
    this._codeBuf = buf >> n;
    this._codeSize = size -= n;

    return value;
  };  

  private getCode(table: HuffmanTable) {
    const stream = this._sourceStream;
    const [codes, maxLength] = table;
    let size = this._codeSize;
    let buf = this._codeBuf;

    let value: number;
    while (size < maxLength) {
      if ((value = stream.takeByte()) === -1) {
        break;
      }
      buf |= value << size;
      size += 8;
    }
    const code = codes[buf & ((1 << maxLength) - 1)];
    const codeLen = code >> 16;
    const codeVal = code & 0xffff;
    if (codeLen < 1 || size < codeLen) {
      throw new Error("Bad encoding in flate stream");
    }
    this._codeBuf = buf >> codeLen;
    this._codeSize = size - codeLen;
    return codeVal;
  };  

  private generateHuffmanTable(lengths: Uint8Array): HuffmanTable {
    const n = lengths.length;

    let maxLength = 0;
    let i: number;
    for (i = 0; i < n; i++) {
      if (lengths[i] > maxLength) {
        maxLength = lengths[i];
      }
    }

    const size = 1 << maxLength;
    const codes = new Int32Array(size);
    for (let length = 1, code = 0, skip = 2; length <= maxLength; length++, code <<= 1, skip <<= 1) {
      for (let value = 0; value < n; value++) {
        if (lengths[value] === length) {
          let code2 = 0;
          let t = code;
          for (i = 0; i < length; i++) {
            code2 = (code2 << 1) | (t & 1);
            t >>= 1;
          }
          for (i = code2; i < size; i += skip) {
            codes[i] = (length << 16) | value;
          }
          code++;
        }
      }
    }

    return [codes, maxLength];
  };
}

