import { DataCryptor } from "./crypto";

export interface Reference {  
  id: number;
  generation: number;
}

export interface Encodable {  
  toArray(cryptor?: DataCryptor): Uint8Array;
}
