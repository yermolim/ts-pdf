import { aes, wordArrayToBytes } from "../crypto";
import { IDataCryptor, Reference } from "../common-interfaces";

export class AESV3DataCryptor implements IDataCryptor {
  protected _n: number;
  protected _key: Uint8Array;

  /**
   * 
   * @param key must be 32 bytes long
   */
  constructor(key: Uint8Array) {
    if (!key) {      
      throw new Error("Empty key");
    }
    if (key.length !== 32) {
      throw new Error(`Invalid key length: ${key.length} (shall be 32)`);
    }

    this._n = key.length;
    this._key = key;
  }

  encrypt(data: Uint8Array, ref: Reference): Uint8Array { 
    return this.run(data, ref.id, ref.generation);
  }

  decrypt(data: Uint8Array, ref: Reference): Uint8Array {
    return this.run(data, ref.id, ref.generation, true);
  }
  
  protected run(data: Uint8Array, id: number, generation: number, decrypt = false): Uint8Array {   
    /*
    1. Use the 32-byte file encryption key for the AES-256 symmetric key algorithm, 
    along with the string or stream data to be encrypted. Use the AES algorithm 
    in Cipher Block Chaining (CBC) mode, which requires an initialization vector. 
    The block size parameter is set to 16 bytes, and the initialization vector 
    is a 16-byte random number that is stored as the first 16 bytes of the encrypted stream or string
    */
    const result = wordArrayToBytes(aes(data, this._key, decrypt));
    return decrypt
      ? result.slice(16)
      : result;
  }
}
