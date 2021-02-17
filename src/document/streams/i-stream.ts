export interface IStream { 
  length: number;

  takeByte(): number;

  takeBytes(length?: number): Uint8Array;

  takeUint16(): number;

  takeInt32(): number;
  
  peekByte(): number;

  peekBytes(length?: number): Uint8Array;
  
  getByteRange?(start: number, end: number): Uint8Array;
}
