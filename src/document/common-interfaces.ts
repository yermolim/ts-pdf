import { Quadruple } from "../common/types";
import { CryptVersion, CryptRevision, CryptMethod } from "./const";

//#region PDF object references
/**interface for the PDF ObjectId-like objects  */
export interface Reference {  
  id: number;
  generation: number;
}

export interface UsedReference extends Reference {
  byteOffset: number;
  compressed?: boolean;
  streamId?: number;
  streamIndex?: number;
}

export interface FreeReference extends Reference {
  nextFreeId: number;
}
//#endregion

/**options used during the PDF objects encryption/decryption */
export interface CryptOptions {
  filter: string;
  version: CryptVersion;
  revision: CryptRevision;
  permissions: number;
  encryptMetadata: boolean;
  keyLength: number;

  stringKeyLength?: number;
  streamKeyLength?: number;

  stringMethod?: CryptMethod;
  streamMethod?: CryptMethod;
  
  oPasswordHash: Uint8Array;
  uPasswordHash: Uint8Array;
  
  oEncPasswordHash?: Uint8Array;
  uEncPasswordHash?: Uint8Array;
  perms?: Uint8Array;
}

export interface IDataCryptor {
  encrypt(data: Uint8Array, ref: Reference): Uint8Array;
  decrypt(data: Uint8Array, ref: Reference): Uint8Array;
}

export interface AuthenticationResult {
  owner: boolean; 
  stringCryptor: IDataCryptor; 
  streamCryptor: IDataCryptor;
}

/**PDF object encryption information */
export interface CryptInfo {
  ref?: Reference;
  stringCryptor?: IDataCryptor;
  streamCryptor?: IDataCryptor;
}

/**serializable to byte array */
export interface IEncodable {  
  /**
   * serialize the current object data to byte array
   * @param cryptInfo PDF object encryption information
   */
  toArray(cryptInfo?: CryptInfo): Uint8Array;
}

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

//#region text data
export interface TextLineData {
  text: string;
  rect: Quadruple;
  relativeRect: Quadruple;
}

export interface TextData {
  width: number;
  height: number;
  rect: Quadruple;
  relativeRect: Quadruple;
  lines: TextLineData[];
}

export interface TextDataOptions {
  maxWidth: number;
  fontSize: number;
  textAlign: "left" | "center" | "right";
  pivotPoint: "top-left" | "center" | "bottom-margin";
}
//#endregion
