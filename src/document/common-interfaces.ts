import { CryptVersion, CryptRevision, CryptMethod } from "./spec-constants";

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
