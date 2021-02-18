import { int32ToBytes } from "../byte-functions";
import { md5, rc4, wordArrayToBytes } from "../crypto";
import { IDataCryptor, Reference } from "../common-interfaces";

export class RC4DataCryptor implements IDataCryptor {
  protected _n: number;
  protected _key: Uint8Array;
  protected _tempKey: Uint8Array;

  constructor(key: Uint8Array) {
    if (!key) {      
      throw new Error("Empty key");
    }
    if (key.length < 5 || key.length > 16) {
      throw new Error(`Invalid key length: ${key.length} (shall be a multiple in range from 40 to 128)`);
    }

    this._n = key.length;
    this._key = key;
    this._tempKey = new Uint8Array(key.length + 5);
  }

  encrypt(data: Uint8Array, ref: Reference): Uint8Array {
    /*
    1. Obtain the object number and generation number from the object identifier 
    of the string or stream to be encrypted. If the string is a direct object, 
    use the identifier of the indirect object containing it

    2. Treating the object number and generation number as binary integers, 
    extend the original n-byte encryption key to n+5 bytes by appending 
    the low-order 3 bytes of the object number and the low-order 2 bytes 
    of the generation number in that order, low-order byte first. 
    (n is 5 unless the value of V in the encryption dictionary is greater than 1, 
      in which case n is the value of Length divided by 8.)
    */
    const idBytes = int32ToBytes(ref.id, true); 
    const genBytes = int32ToBytes(ref.generation, true); 
    this._tempKey.set(this._key, 0);
    this._tempKey.set(idBytes.slice(0, 3), this._n);
    this._tempKey.set(genBytes.slice(0, 2), this._n + 3);
    
    // 3. Initialize the MD5 hash function and pass the result of step 2 as input to this function
    const hash = wordArrayToBytes(md5(this._tempKey));

    /*
    4. Use the first (n+5) bytes, up to a maximum of 16, of the output 
    from the MD5 hash as the key for the RC4 or AES symmetric key algorithms, 
    along with the string or stream data to be encrypted
    */
    const n = Math.min(this._n + 5, 16);
    const key = hash.slice(0, n);

    const encrypted = wordArrayToBytes(rc4(data, key));
    return encrypted;
  }

  decrypt(data: Uint8Array, ref: Reference): Uint8Array {
    return this.encrypt(data, ref);
  }  
}
