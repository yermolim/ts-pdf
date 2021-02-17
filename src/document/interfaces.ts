import { CryptVersion, CryptRevision, CryptMethod } from "./const";

export interface Reference {  
  id: number;
  generation: number;
}

export interface Encodable {  
  toArray(cryptInfo?: CryptInfo): Uint8Array;
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

export interface DataCryptor {
  encrypt(data: Uint8Array, ref: Reference): Uint8Array;
  decrypt(data: Uint8Array, ref: Reference): Uint8Array;
}

export interface AuthenticationResult {
  authLevel: "user" | "owner"; 
  stringCryptor: DataCryptor; 
  streamCryptor: DataCryptor;
}

export interface CryptInfo {
  ref: Reference;
  stringCryptor: DataCryptor;
  streamCryptor: DataCryptor;
}
