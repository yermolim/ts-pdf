import { int32ToBytes, int32ArrayToBytes } from "../byte-functions";
import { DataCryptor, md5, aes, AES_INIT_VALUE } from "../crypto";

/**
 * If using the AES-128 algorithm, extend the encryption key an additional 4 bytes 
 * by adding the value "sAlT", which corresponds to the hexadecimal values 0x73, 0x41, 0x6C, 0x54. 
 * (This addition is done for backward compatibility and is not intended to provide additional security.)
 */
const AESV2_KEY_PADDING = [
  0x73, 0x41, 0x6C, 0x54,
] as const;


export class AESV2DataCryptor implements DataCryptor {
  protected _n: number;
  protected _key: Uint8Array;
  protected _tempKey: Uint8Array;

  constructor(key: Uint8Array) {
    if (!key) {      
      throw new Error("Empty key");
    }
    if (key.length !== 16) {
      throw new Error(`Invalid key length: ${key.length} (shall be 16)`);
    }

    this._n = key.length;
    this._key = key;
    this._tempKey = new Uint8Array(key.length + 9);
  }

  encrypt(data: Uint8Array, id: number, generation: number): Uint8Array {
    return this.run(data, id, generation, AES_INIT_VALUE);
  }

  decrypt(data: Uint8Array, id: number, generation: number): Uint8Array {
    return this.run(data, id, generation);
  }  

  protected run(data: Uint8Array, id: number, generation: number, iv?: Uint8Array): Uint8Array {
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
    If using the AES algorithm, extend the encryption key an additional 4 bytes 
    by adding the value "sAlT", which corresponds to the hexadecimal values 0x73, 0x41, 0x6C, 0x54. 
    (This addition is done for backward compatibility and is not intended to provide additional security.)
    */
    const idBytes = int32ToBytes(id, true); 
    const genBytes = int32ToBytes(generation, true); 
    this._tempKey.set(this._key, 0);
    this._tempKey.set(idBytes.subarray(0, 3), this._n);
    this._tempKey.set(genBytes.subarray(0, 2), this._n + 3);
    this._tempKey.set(AESV2_KEY_PADDING, this._n + 5);
    
    // 3. Initialize the MD5 hash function and pass the result of step 2 as input to this function
    const hash = int32ArrayToBytes(md5(this._tempKey).words);

    /*
    4. Use the first (n+5) bytes, up to a maximum of 16, of the output 
    from the MD5 hash as the key for the RC4 or AES symmetric key algorithms, 
    along with the string or stream data to be encrypted.
    If using the AES algorithm, the Cipher Block Chaining (CBC) mode, 
    which requires an initialization vector, is used. 
    The block size parameter is set to 16 bytes, and the initialization vector 
    is a 16-byte random number that is stored as the first 16 bytes of the encrypted stream or string
    */
    const n = Math.max(this._n + 5, 16);
    const key = hash.slice(0, n);
    iv ??= data.slice(0, 16);
    const encrypted = int32ArrayToBytes(aes(data, key, iv).words);
    return encrypted;
  }
}
