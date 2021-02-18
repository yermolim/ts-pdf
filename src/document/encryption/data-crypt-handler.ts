/* eslint-disable no-bitwise */
import { arraysEqual, findSubarrayIndex, 
  int32ArrayToBytes, int32ToBytes, xorBytes } from "../byte-functions";
import { CryptMethod, cryptMethods, CryptRevision, CryptVersion } from "../const";
import { md5, rc4, toWordArray } from "../crypto";
import { CryptOptions, AuthenticationResult, IDataCryptor } from "../common-interfaces";
import { AESV2DataCryptor } from "./aesv2-data-cryptor";
import { AESV3DataCryptor } from "./aesv3-data-cryptor";
import { IdentityDataCryptor } from "./identity-data-cryptor";
import { RC4DataCryptor } from "./rc4-data-cryptor";

/**
 * Pad or truncate the password string to exactly 32 bytes. 
 * If the password string is more than 32 bytes long, 
 * use only its first 32 bytes; 
 * if it is less than 32 bytes long, pad it by appending 
 * the required number of additional bytes 
 * from the beginning of the following padding string
 */
const PASSWORD_32_PADDING = [
  0x28, 0xBF, 0x4E, 0x5E, 0x4E, 0x75, 0x8A, 0x41, 
  0x64, 0x00, 0x4E, 0x56, 0xFF, 0xFA, 0x01, 0x08,
  0x2E, 0x2E, 0x00, 0xB6, 0xD0, 0x68, 0x3E, 0x80,
  0x2F, 0x0C, 0xA9, 0xFE, 0x64, 0x53, 0x69, 0x7A,
] as const;

export class DataCryptHandler {
  protected _filter: string;
  protected _version: CryptVersion;
  protected _revision: CryptRevision;
  protected _permissions: number;
  protected _encryptMetadata: boolean;
  protected _keyLength: number;

  protected _stringKeyLength: number;
  protected _streamKeyLength: number;

  protected _stringMethod: CryptMethod;
  protected _streamMethod: CryptMethod;
  
  protected _oPasswordHash: Uint8Array;
  protected _uPasswordHash: Uint8Array;
  
  protected _oEncPasswordHash: Uint8Array;
  protected _uEncPasswordHash: Uint8Array;
  protected _perms: Uint8Array;

  protected _fileId: Uint8Array;

  protected _lastEncryptionKey: Uint8Array;

  constructor(options: CryptOptions, fileId: Uint8Array) {  
    const { filter, version, revision, 
      permissions, encryptMetadata,
      keyLength, stringKeyLength, streamKeyLength,
      stringMethod, streamMethod,
      oPasswordHash, uPasswordHash,
      oEncPasswordHash, uEncPasswordHash,
      perms } = options;

    if (filter !== "/Standard") {
      throw new Error(`Unsupported filter name: ${filter}`);
    }
    
    if (![1, 2, 4, 5].includes(version)) {
      throw new Error(`Unsupported algorithm version: ${version}`);
    }

    if (![2, 3, 4, 5, 6].includes(revision)) {
      throw new Error(`Unsupported algorithm revision: ${revision}`);
    }
    
    if (isNaN(permissions)) {
      throw new Error("Permissions not provided");
    }
    
    if (!oPasswordHash || !uPasswordHash) {
      throw new Error("Password hash not provided");
    }
      
    this._filter = filter;
    this._version = version;
    this._revision = revision;
    this._permissions = permissions;
    this._keyLength = keyLength;
    this._encryptMetadata = encryptMetadata;

    this._stringKeyLength = stringKeyLength;
    this._streamKeyLength = streamKeyLength;

    this._stringMethod = stringMethod;
    this._streamMethod = streamMethod;
    
    this._oPasswordHash = oPasswordHash;
    this._uPasswordHash = uPasswordHash;
    
    this._oEncPasswordHash = oEncPasswordHash;
    this._uEncPasswordHash = uEncPasswordHash;
    this._perms = perms;

    this._fileId = fileId;
  }

  authenticate(password?: string): AuthenticationResult {
    const version = this._version;
    const stringMethod = this._stringMethod;
    const streamMethod = this._streamMethod;

    let authorized: "user" | "owner";
    const ownerAuthenticated = this.authOwnerPassword(password);
    if (ownerAuthenticated) {
      authorized = "owner";
    } else {      
      const userAuthenticated = this.authUserPassword(password);
      authorized = userAuthenticated 
        ? "user"
        : null;
    }
    if (!authorized) {
      return null;
    }

    const key = this._lastEncryptionKey;

    switch (version) {
      case 1:
        const rc4_40 = new RC4DataCryptor(key);
        return {
          authLevel: authorized, 
          stringCryptor: rc4_40, 
          streamCryptor: rc4_40,
        };
      case 2:
        const rc4_128 = new RC4DataCryptor(key);
        return {
          authLevel: authorized, 
          stringCryptor: rc4_128, 
          streamCryptor: rc4_128,
        };
      case 4:
        let v4stringCryptor: IDataCryptor;
        if (!stringMethod || stringMethod === cryptMethods.NONE) {
          v4stringCryptor = new IdentityDataCryptor();
        } else if (stringMethod === cryptMethods.RC4) {
          v4stringCryptor = new RC4DataCryptor(key);
        } else if (stringMethod === cryptMethods.AES_128) {
          v4stringCryptor = new AESV2DataCryptor(key);
        } else {          
          throw new Error(`Invalid crypt method: ${stringMethod}`);
        }
        let v4streamCryptor: IDataCryptor;
        if (!streamMethod || streamMethod === cryptMethods.NONE) {
          v4streamCryptor = new IdentityDataCryptor();
        } else if (streamMethod === cryptMethods.RC4) {
          v4streamCryptor = new RC4DataCryptor(key);
        } else if (streamMethod === cryptMethods.AES_128) {
          v4streamCryptor = new AESV2DataCryptor(key);
        } else {          
          throw new Error(`Invalid crypt method: ${streamMethod}`);
        }
        return {
          authLevel: authorized, 
          stringCryptor: v4stringCryptor, 
          streamCryptor: v4streamCryptor,
        };
      case 5:
        let v5stringCryptor: IDataCryptor;
        if (!stringMethod || stringMethod === cryptMethods.NONE) {
          v4stringCryptor = new IdentityDataCryptor();
        } else if (stringMethod === cryptMethods.AES_256) {
          v4stringCryptor = new AESV3DataCryptor(key);
        } else {          
          throw new Error(`Invalid crypt method: ${stringMethod}`);
        }
        let v5streamCryptor: IDataCryptor;
        if (!streamMethod || streamMethod === cryptMethods.NONE) {
          v4streamCryptor = new IdentityDataCryptor();
        } else if (streamMethod === cryptMethods.AES_256) {
          v4streamCryptor = new AESV3DataCryptor(key);
        } else {          
          throw new Error(`Invalid crypt method: ${streamMethod}`);
        }  
        return {
          authLevel: authorized, 
          stringCryptor: v5stringCryptor, 
          streamCryptor: v5streamCryptor,
        };
    }
  }

  protected padPassword32(password?: string): Uint8Array {
    if (!password) {
      return new Uint8Array(PASSWORD_32_PADDING);
    }

    const bytes = new TextEncoder().encode(password);

    const padded = new Uint8Array(32);
    padded.set(bytes.slice(0, 32));
    if (bytes.length < 32) {
      padded.set(PASSWORD_32_PADDING.slice(0, 32 - bytes.length), bytes.length);
    }

    return padded;
  }

  protected computeEncryptionKey(password?: string): Uint8Array {
    if ([2, 3, 4].includes(this._revision)) {
      // 1. Pad or truncate the password string to exactly 32 bytes
      const paddedPassword = this.padPassword32(password);
      const permissionsLe = int32ToBytes(this._permissions, true);
      const metadata = this._revision >= 4 && !this._encryptMetadata 
        ? new Uint8Array([255, 255, 255, 255])
        : new Uint8Array(0);
      const dataToHash = new Uint8Array([
        // 2. Initialize the MD5 hash function and pass the result of step 1 as input to this function
        ...paddedPassword,
        // 3. Pass the value of the encryption dictionary’s O entry to the MD5 hash function
        ...this._oPasswordHash,
        // 4. Treat the value of the P entry as an unsigned 4-byte integer 
        // and pass these bytes to the MD5 hash function, low-order byte first
        ...permissionsLe,
        /* 
        5. Pass the first element of the file’s file identifier array. 
        The first element of the ID array generally remains the same for a given document. 
        However, in some situations, Acrobat may regenerate the ID array if a new generation of a document is created. 
        Security handlers are encouraged not to rely on the ID in the encryption key computation
        */
        ...this._fileId,
        // 6. (Revision 4 or greater) If document metadata is not being encrypted, 
        // pass 4 bytes with the value 0xFFFFFFFF to the MD5 hash function
        ...metadata,
      ]);
      // 7. Finish the hash
      let hash = int32ArrayToBytes(md5(dataToHash).words);
      const keyLength = this._keyLength >> 3;

      /*
      8. (Revision 3 or greater) Do the following 50 times: Take the output from the previous MD5 hash 
      and pass the first n bytes of the output as input into a new MD5 hash, where n is the number 
      of bytes of the encryption key as defined by the value of the encryption dictionary’s Length entry
      */
      if (this._revision >= 3) {
        for (let i = 0; i < 50; i++) {
          hash = int32ArrayToBytes(md5(hash.slice(0, keyLength)).words);
        }
      }

      /*
      9. Set the encryption key to the first n bytes of the output from the final MD5 hash, 
      where n is always 5 for revision 2 but, for revision 3 or greater, depends 
      on the value of the encryption dictionary’s Length entry
      */
      const encryptionKey = hash.slice(0, keyLength);
      this._lastEncryptionKey = encryptionKey;
      return encryptionKey;
    } else if (this._revision === 5) {
      // TODO: implement
      throw new Error("Not implemented yet");
    } else if (this._revision === 6) {
      // TODO: implement
      throw new Error("Not implemented yet");
    }
  }

  protected computeOHashEncryptionKey_R2R3R4(password?: string): Uint8Array {
    /*
    1. Pad or truncate the owner password string. 
    If there is no owner password, use the user password instead.
    */
    const paddedPassword = this.padPassword32(password);

    // 2. Initialize the MD5 hash function and pass the result of step 1 as input to this function
    let hash = md5(paddedPassword);

    /*
    3. (Revision 3 or greater) Do the following 50 times: Take the output 
    from the previous MD5 hash and pass it as input into a new MD5 hash
    */
    if (this._revision >= 3) {
      for (let i = 0; i < 50; i++) {
        hash = md5(hash);
      }
    }

    /*
    4. Create an RC4 encryption key using the first n bytes of the output from the final MD5 hash, 
    where n is always 5 for revision 2 but, for revision 3 or greater, depends on the value 
    of the encryption dictionary’s Length entry
    */
    const hashArray = int32ArrayToBytes(hash.words);
    const keyLength = this._keyLength >> 3;
    return hashArray.slice(0, keyLength);
  }

  protected computeOHash_R2R3R4(oPassword?: string, uPassword?: string): Uint8Array {
    // 1 - 4.
    const key = this.computeOHashEncryptionKey_R2R3R4(oPassword || uPassword);
    
    // 5. Pad or truncate the user password string
    const paddedUPassword = this.padPassword32(uPassword);

    /*
    6. Encrypt the result of step 5, using an RC4 encryption function 
    with the encryption key obtained in step 4
    */
    let hash = rc4(paddedUPassword, key);

    /*
    7. (Revision 3 or greater) Do the following 19 times: 
    Take the output from the previous invocation of the RC4 function 
    and pass it as input to a new invocation of the function; 
    use an encryption key generated by taking each byte of the encryption key 
    obtained in step 4 and performing an XOR (exclusive or) operation 
    between that byte and the single-byte value of the iteration counter (from 1 to 19)
    */
    if (this._revision >= 3) {
      for (let i = 1; i < 20; i++) {
        hash = rc4(hash, xorBytes(key, i));
      }
    }
    return int32ArrayToBytes(hash.words);
  }

  protected computeUHash_R2(password?: string): Uint8Array {
    // 1. Create an encryption key based on the user password string
    const key = this.computeEncryptionKey(password);

    /* 
    2. Encrypt the 32-byte padding string, using an RC4 encryption function 
    with the encryption key from the preceding step
    */
    const padding = new Uint8Array(PASSWORD_32_PADDING);
    const u = int32ArrayToBytes(rc4(padding, key).words);
    return u;
  }

  protected computeUHash_R3R4(password?: string): Uint8Array {
    // 1. Create an encryption key based on the user password string
    const key = this.computeEncryptionKey(password); 

    const dataToHash = new Uint8Array([
      // 2. Initialize the MD5 hash function and pass the 32-byte padding string shown in step 1
      ...PASSWORD_32_PADDING,
      // 3. Pass the first element of the file’s file identifier array to the hash function and finish the hash
      ...this._fileId,
    ]);
    let hash = md5(dataToHash);

    /* 
    4. Encrypt the 16-byte result of the hash, 
    using an RC4 encryption function with the encryption key from step 1
    */
    hash = rc4(hash, key);

    /* 
    5. Do the following 19 times: Take the output from the previous invocation 
    of the RC4 function and pass it as input to a new invocation of the function; 
    use an encryption key generated by taking each byte of the original encryption key 
    (obtained in step 1) and performing an XOR (exclusive or) operation between 
    that byte and the single-byte value of the iteration counter (from 1 to 19)
    */
    for (let i = 1; i < 20; i++) {
      hash = rc4(hash, xorBytes(key, i));
    }
    return int32ArrayToBytes(hash.words);
  }
  
  protected authOwnerPassword(password?: string): boolean {
    if ([2, 3, 4].includes(this._revision)) {
      // 1. Compute an encryption key from the supplied password string
      const ownerEncryptionKey = this.computeOHashEncryptionKey_R2R3R4(password);

      let userPasswordPadded: Uint8Array;
      if (this._revision === 2) {
        /*
        2. (Revision 2 only) Decrypt the value of the encryption dictionary’s O entry, 
        using an RC4 encryption function with the encryption key computed in step 1
        */
        userPasswordPadded = int32ArrayToBytes(rc4(this._oPasswordHash, ownerEncryptionKey).words);
      } else {
        /*
        2. (Revision 3 or greater) Do the following 20 times: Decrypt the value of the encryption 
        dictionary’s O entry (first iteration) or the output from the previous iteration (all subsequent iterations), 
        using an RC4 encryption function with a different encryption key at each iteration. 
        The key is generated by taking the original key (obtained in step 1) and performing an XOR (exclusive or) 
        operation between each byte of the key and the single-byte value of the iteration counter (from 19 to 0)
        */
        let hash = toWordArray(this._oPasswordHash);
        for (let i = 19; i >= 0; i--) {
          hash = rc4(hash, xorBytes(ownerEncryptionKey, i));
        }
        userPasswordPadded = int32ArrayToBytes(hash.words);
      }
        
      // 3. The result of step 2 purports to be the user password
      // find padding and remove it if present
      const j = findSubarrayIndex(userPasswordPadded, new Uint8Array(PASSWORD_32_PADDING));
      const userPassword = new TextDecoder().decode(j === -1 
        ? userPasswordPadded
        : userPasswordPadded.subarray(0, j));
      return this.authUserPassword(userPassword);
    } else if (this._revision === 5) {
      // TODO: implement
      throw new Error("Not implemented yet");
    } else if (this._revision === 6) {
      // TODO: implement
      throw new Error("Not implemented yet");
    }
  }

  protected authUserPassword(password?: string): boolean {
    let u: Uint8Array;
    if (this._revision === 2) {
      u = this.computeUHash_R2(password);

      console.log(u);
      console.log(this._uPasswordHash);

      return arraysEqual(this._uPasswordHash, u);
    } else if (this._revision === 3 || this._revision === 4) {
      u = this.computeUHash_R3R4(password); 
      return arraysEqual(this._uPasswordHash.subarray(0, 16), u);
    } else if (this._revision === 5) {
      // TODO: implement
      throw new Error("Not implemented yet");
    } else if (this._revision === 6) {
      // TODO: implement
      throw new Error("Not implemented yet");
    }
  }
}
