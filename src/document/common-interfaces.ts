import { CryptVersion, CryptRevision, CryptMethod } from "./const";

export interface Reference {  
  id: number;
  generation: number;
}

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
  authLevel: "user" | "owner"; 
  stringCryptor: IDataCryptor; 
  streamCryptor: IDataCryptor;
}

export interface CryptInfo {
  stringCryptor: IDataCryptor;
  streamCryptor: IDataCryptor;
  ref?: Reference;
}

export interface IEncodable {  
  toArray(cryptInfo?: CryptInfo): Uint8Array;
}

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
