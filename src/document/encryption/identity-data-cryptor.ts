import { IDataCryptor, Reference } from "../common-interfaces";

/**
 * "null-object" encryption handler. returns plain data without actually encrypting or decrypting it
 */
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
