import { IDataCryptor, Reference } from "../interfaces";

export class IdentityDataCryptor implements IDataCryptor {
  constructor() {
    
  }

  encrypt(data: Uint8Array, ref: Reference): Uint8Array {
    return data;
  }

  decrypt(data: Uint8Array, ref: Reference): Uint8Array {
    return data;
  }  
}
