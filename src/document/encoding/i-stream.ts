export interface IStream { 
  /**stream length (bytes) */
  length: number;

  /**return the byte at the current index. increments the current index */
  takeByte(): number;

  /**return bytes starting at the current index. increments the current index by the length value */
  takeBytes(length?: number): Uint8Array;
  
  /**return the Uint16 value parsed starting at the current index. increments the current index by two */
  takeUint16(): number;

  /**return the Uint32 value parsed starting at the current index. increments the current index by four */
  takeInt32(): number;
  
  /**return the byte at the current index without incrementing the current index */
  peekByte(): number;

  /**return bytes starting at the current index without incrementing the current index */
  peekBytes(length?: number): Uint8Array;
  
  /**
   * return byte array. implementations are allowed to return SUBARRAY (for speed's sake) so should be used as READ-ONLY
   * @param start inclusive
   * @param end exclusive
   */
  getByteRange?(start: number, end: number): Uint8Array;
}
