import { DataCryptor } from "../crypto";

export class IdentityDataCryptor implements DataCryptor {
  constructor() {
    
  }

  encrypt(data: Uint8Array, id: number, generation: number): Uint8Array {
    return data;
  }

  decrypt(data: Uint8Array, id: number, generation: number): Uint8Array {
    return data;
  }  
}
