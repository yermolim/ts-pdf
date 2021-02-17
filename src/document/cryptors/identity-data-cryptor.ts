import { DataCryptor, Reference } from "../interfaces";

export class IdentityDataCryptor implements DataCryptor {
  constructor() {
    
  }

  encrypt(data: Uint8Array, ref: Reference): Uint8Array {
    return data;
  }

  decrypt(data: Uint8Array, ref: Reference): Uint8Array {
    return data;
  }  
}
